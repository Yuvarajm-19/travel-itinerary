const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

/**
 * Lazily initialise the Gemini client so the module can be imported
 * without a key during testing.
 */
const getClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// ── Prompt builder ────────────────────────────────────────────────────────────

const buildPrompt = (extractedDataArray) => {
  const docSummaries = extractedDataArray.map((doc, i) => {
    const idx = i + 1;
    switch (doc.documentType) {
      case 'flight':
        return `Document ${idx} — FLIGHT TICKET:
  Airline: ${doc.flight?.airline || 'N/A'}
  Flight: ${doc.flight?.flightNumber || 'N/A'}
  From: ${doc.flight?.departureCity || 'N/A'} at ${doc.flight?.departureTime || 'N/A'} on ${doc.flight?.departureDate || 'N/A'}
  To: ${doc.flight?.arrivalCity || 'N/A'} at ${doc.flight?.arrivalTime || 'N/A'}
  Booking Ref: ${doc.flight?.bookingRef || 'N/A'}`;

      case 'hotel':
        return `Document ${idx} — HOTEL RESERVATION:
  Hotel: ${doc.hotel?.hotelName || 'N/A'}
  Address: ${doc.hotel?.address || 'N/A'}
  Check-in: ${doc.hotel?.checkInDate || 'N/A'}
  Check-out: ${doc.hotel?.checkOutDate || 'N/A'}
  Room: ${doc.hotel?.roomType || 'N/A'}
  Booking Ref: ${doc.hotel?.bookingRef || 'N/A'}`;

      case 'train':
        return `Document ${idx} — TRAIN TICKET:
  Train: ${doc.train?.trainName || ''} ${doc.train?.trainNumber || 'N/A'}
  From: ${doc.train?.departureStation || 'N/A'} at ${doc.train?.departureTime || 'N/A'}
  To: ${doc.train?.arrivalStation || 'N/A'} at ${doc.train?.arrivalTime || 'N/A'}
  Date: ${doc.train?.date || 'N/A'}
  Class: ${doc.train?.class || 'N/A'}
  PNR: ${doc.train?.bookingRef || 'N/A'}`;

      case 'bus':
        return `Document ${idx} — BUS TICKET:
  Operator: ${doc.bus?.busOperator || 'N/A'}
  From: ${doc.bus?.departure || 'N/A'} at ${doc.bus?.departureTime || 'N/A'}
  To: ${doc.bus?.arrival || 'N/A'}
  Date: ${doc.bus?.date || 'N/A'}
  Seat: ${doc.bus?.seatNumber || 'N/A'}`;

      default:
        return `Document ${idx} — TRAVEL DOCUMENT (raw text excerpt):
${doc.rawText?.substring(0, 400) || 'No text extracted'}`;
    }
  });

  return `You are an expert travel planner and itinerary specialist.

The traveller has uploaded ${extractedDataArray.length} travel booking document(s). Below is the structured information extracted from each document:

${docSummaries.join('\n\n')}

Based ONLY on the information above, generate a comprehensive, well-structured travel itinerary.

Return ONLY a valid JSON object (no markdown, no code fences, no extra text) matching this exact schema:

{
  "tripTitle": "string — catchy descriptive title",
  "destination": "string — primary destination(s)",
  "startDate": "string — trip start date",
  "endDate": "string — trip end date",
  "duration": "number — total days",
  "summary": "string — 3-4 sentence engaging trip overview",
  "itineraryDays": [
    {
      "day": 1,
      "date": "string",
      "title": "string — day theme",
      "description": "string — detailed day narrative",
      "activities": ["string"],
      "meals": ["string — meal suggestion"],
      "transport": ["string — transport detail"],
      "accommodation": "string — where to stay",
      "tips": ["string — insider tip"]
    }
  ],
  "accommodationDetails": "string — full accommodation summary",
  "transportationDetails": "string — full transport summary",
  "recommendations": [
    "string — must-visit attraction or experience"
  ],
  "reminders": [
    "string — important reminder or checklist item"
  ],
  "packingSuggestions": [
    "string — packing item"
  ],
  "estimatedBudget": "string — rough budget range based on destinations",
  "weatherInfo": "string — typical weather and clothing advice"
}

Rules:
- Be specific and actionable with all suggestions.
- If dates are known, generate a day-by-day itinerary covering every day of travel.
- If dates are missing, generate a logical template itinerary.
- Include at least 5 recommendations, 5 reminders, and 8 packing suggestions.
- Keep all string values concise but informative.
- Do NOT include any text outside the JSON object.`;
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a structured travel itinerary using Gemini.
 * @param {Array<object>} extractedDataArray  Array of OCR extraction results
 * @returns {Promise<object>}  Parsed itinerary JSON
 */
const generateItinerary = async (extractedDataArray) => {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildPrompt(extractedDataArray);

  let responseText;
  try {
    const result = await model.generateContent(prompt);
    responseText = result.response.text();
  } catch (err) {
    throw new Error(`Gemini API error: ${err.message}`);
  }

  // Strip possible markdown code fences
  const cleaned = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt to salvage with a greedy JSON extraction
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('Gemini returned malformed JSON. Please try again.');
      }
    } else {
      throw new Error('Gemini did not return valid JSON. Please try again.');
    }
  }

  return parsed;
};

module.exports = { generateItinerary };
