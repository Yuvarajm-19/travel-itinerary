const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = 'gemini-2.0-flash';

let client = null;

/**
 * Logging utility
 */
const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[GeminiService]', new Date().toISOString(), ...args);
  }
};

const errorLog = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';
  console.error(`[GeminiService] ${timestamp} Error:`, message, context);
  if (stack && process.env.NODE_ENV !== 'production') {
    console.error('Stack:', stack);
  }
};

/**
 * Get or create Gemini client with validation
 */
const getClient = () => {
  if (client) return client;

  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY is not configured in .env file');
    errorLog(err, { env_check: 'GEMINI_API_KEY' });
    throw err;
  }

  if (GEMINI_API_KEY.length < 20) {
    const err = new Error('GEMINI_API_KEY appears invalid (too short)');
    errorLog(err, { keyLength: GEMINI_API_KEY.length });
    throw err;
  }

  debug('Initializing Gemini client with model:', GEMINI_MODEL);
  client = new GoogleGenerativeAI(GEMINI_API_KEY);
  return client;
};

/**
 * Build structured prompt for itinerary generation
 */
const buildPrompt = (extractedDataArray) => {
  const docSummaries = extractedDataArray.map((doc, i) => {
    const docIndex = i + 1;

    switch (doc.documentType) {
      case 'flight':
        return `Document ${docIndex} — FLIGHT TICKET:
Airline: ${doc.flight?.airline || 'N/A'}
Flight Number: ${doc.flight?.flightNumber || 'N/A'}
Departure: ${doc.flight?.departureCity || 'N/A'} at ${doc.flight?.departureTime || 'N/A'} on ${doc.flight?.departureDate || 'N/A'}
Arrival: ${doc.flight?.arrivalCity || 'N/A'} at ${doc.flight?.arrivalTime || 'N/A'}
Booking Reference: ${doc.flight?.bookingRef || 'N/A'}`;

      case 'hotel':
        return `Document ${docIndex} — HOTEL RESERVATION:
Hotel Name: ${doc.hotel?.hotelName || 'N/A'}
Address: ${doc.hotel?.address || 'N/A'}
Check-in Date: ${doc.hotel?.checkInDate || 'N/A'}
Check-out Date: ${doc.hotel?.checkOutDate || 'N/A'}
Room Type: ${doc.hotel?.roomType || 'N/A'}
Booking Reference: ${doc.hotel?.bookingRef || 'N/A'}`;

      case 'train':
        return `Document ${docIndex} — TRAIN TICKET:
Train Name: ${doc.train?.trainName || 'N/A'} (Number: ${doc.train?.trainNumber || 'N/A'})
Departure: ${doc.train?.departureStation || 'N/A'} at ${doc.train?.departureTime || 'N/A'}
Arrival: ${doc.train?.arrivalStation || 'N/A'} at ${doc.train?.arrivalTime || 'N/A'}
Travel Date: ${doc.train?.date || 'N/A'}
Class: ${doc.train?.class || 'N/A'}
PNR: ${doc.train?.bookingRef || 'N/A'}`;

      case 'bus':
        return `Document ${docIndex} — BUS TICKET:
Operator: ${doc.bus?.busOperator || 'N/A'}
Departure: ${doc.bus?.departure || 'N/A'} at ${doc.bus?.departureTime || 'N/A'}
Arrival: ${doc.bus?.arrival || 'N/A'}
Travel Date: ${doc.bus?.date || 'N/A'}
Seat Number: ${doc.bus?.seatNumber || 'N/A'}`;

      default:
        return `Document ${docIndex} — TRAVEL DOCUMENT:
${doc.rawText?.substring(0, 500) || 'No text extracted'}`;
    }
  });

  return `You are an expert travel planner and itinerary specialist.

The traveller has uploaded ${extractedDataArray.length} booking document(s). Below is the structured information extracted from each document:

${docSummaries.join('\n\n')}

Based ONLY on the information above, generate a comprehensive, well-structured travel itinerary.

Return ONLY a valid JSON object (no markdown, no code fences, no extra text, no explanations) matching this exact schema:

{
  "tripTitle": "string — catchy descriptive title",
  "destination": "string — primary destination(s)",
  "startDate": "string — trip start date (e.g. 2024-01-15)",
  "endDate": "string — trip end date (e.g. 2024-01-20)",
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
  "recommendations": ["string — must-visit attraction or experience"],
  "reminders": ["string — important reminder or checklist item"],
  "packingSuggestions": ["string — packing item"],
  "estimatedBudget": "string — rough budget range based on destinations",
  "weatherInfo": "string — typical weather and clothing advice"
}

Rules:
- Be specific and actionable with all suggestions.
- If dates are known, generate a day-by-day itinerary covering every day of travel.
- If dates are missing, generate a logical template itinerary.
- Include at least 5 recommendations, 5 reminders, and 8 packing suggestions.
- Keep all string values concise but informative.
- Do NOT include any text outside the JSON object.
- Do NOT include code fences or markdown.`;
};

/**
 * Attempt to parse JSON from response, handling markdown code fences
 */
const tryParseJson = (responseText) => {
  if (typeof responseText !== 'string' || !responseText.trim()) {
    throw new Error('Empty response from Gemini API');
  }

  debug('Parsing Gemini response', { length: responseText.length });

  const cleanedText = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    debug('Primary JSON parse failed, attempting greedy extraction');

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Gemini response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (greedyError) {
      throw new Error('Unable to parse JSON even after greedy extraction');
    }
  }
};

/**
 * Build a fallback itinerary when Gemini fails
 */
const buildFallbackItinerary = (error) => {
  const reason = error instanceof Error ? error.message : String(error);
  errorLog(error, { fallbackTriggered: true });

  return {
    tripTitle: 'Itinerary Generation Temporarily Unavailable',
    destination: 'Unknown',
    startDate: '',
    endDate: '',
    duration: 0,
    summary: `Gemini API was unable to generate a detailed itinerary at this time. Error: ${reason}. Please try again in a few moments or contact support if the issue persists.`,
    itineraryDays: [],
    accommodationDetails: 'Accommodation details will be available after Gemini connection is restored.',
    transportationDetails: 'Transportation details will be available after Gemini connection is restored.',
    recommendations: [
      'Verify your internet connection.',
      'Ensure your Google AI API key is valid and active.',
      'Check that the API quota has not been exceeded.',
      'Try uploading your documents again.',
      'Review your travel documents for completeness and clarity.',
    ],
    reminders: [
      'Your travel documents have been saved and can be re-processed.',
      'Check the API key in your .env file.',
      'Ensure GEMINI_API_KEY is not empty or whitespace-only.',
      'Retry after a few minutes if the API is experiencing temporary issues.',
      'Contact support if the error persists.',
    ],
    packingSuggestions: [
      'Passport and travel ID',
      'Travel insurance documents',
      'Phone and chargers',
      'Medications and first-aid kit',
      'Weather-appropriate clothing',
      'Comfortable walking shoes',
      'Toiletries and personal care items',
      'Travel adapter and converters',
    ],
    estimatedBudget: 'Unable to estimate at this time',
    weatherInfo: 'Unable to provide weather information at this time',
  };
};

/**
 * Generate a structured travel itinerary using Gemini
 * @param {Array<object>} extractedDataArray - Array of OCR extraction results
 * @returns {Promise<object>} - Parsed itinerary JSON or fallback
 */
const generateItinerary = async (extractedDataArray) => {
  if (!Array.isArray(extractedDataArray) || extractedDataArray.length === 0) {
    const err = new Error('extractedDataArray must be a non-empty array');
    errorLog(err);
    throw err;
  }

  debug('Starting itinerary generation', {
    model: GEMINI_MODEL,
    documentCount: extractedDataArray.length,
  });

  try {
    const client = getClient();
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildPrompt(extractedDataArray);

    debug('Sending request to Gemini', { promptLength: prompt.length });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    });

    if (!result || !result.response) {
      throw new Error('Invalid response structure from Gemini API');
    }

    let responseText;
    if (typeof result.response.text === 'function') {
      responseText = result.response.text();
    } else if (typeof result.response.text === 'string') {
      responseText = result.response.text;
    } else {
      responseText = String(result.response);
    }

    debug('Received response from Gemini', { responseLength: responseText.length });

    const parsed = tryParseJson(responseText);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Gemini returned a non-object response');
    }

    debug('Successfully parsed itinerary JSON');
    return parsed;
  } catch (err) {
    errorLog(err, {
      stage: 'generateItinerary',
      model: GEMINI_MODEL,
      documentCount: extractedDataArray.length,
    });

    return buildFallbackItinerary(err);
  }
};

module.exports = { generateItinerary };
