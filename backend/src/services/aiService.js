const OpenAI = require('openai');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

let client = null;

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') console.debug('[AIService]', ...args);
};

const errorLog = (err, meta = {}) => {
  try {
    console.error('[AIService] Error:', err && err.message ? err.message : err, JSON.stringify(meta));
  } catch (e) {
    console.error('[AIService] Error logging failure');
  }
};

const getClient = () => {
  if (client) return client;
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not configured in .env');

  client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: OPENROUTER_API_KEY });
  return client;
};

const buildPrompt = (extractedDataArray) => {
  const docSummaries = extractedDataArray.map((doc, i) => {
    const idx = i + 1;
    switch (doc.documentType) {
      case 'flight':
        return `Document ${idx} — FLIGHT TICKET:\nAirline: ${doc.flight?.airline || 'N/A'}\nFlight: ${doc.flight?.flightNumber || 'N/A'}\nFrom: ${doc.flight?.departureCity || 'N/A'} at ${doc.flight?.departureTime || 'N/A'} on ${doc.flight?.departureDate || 'N/A'}\nTo: ${doc.flight?.arrivalCity || 'N/A'} at ${doc.flight?.arrivalTime || 'N/A'}\nBooking Ref: ${doc.flight?.bookingRef || 'N/A'}`;
      case 'hotel':
        return `Document ${idx} — HOTEL RESERVATION:\nHotel: ${doc.hotel?.hotelName || 'N/A'}\nAddress: ${doc.hotel?.address || 'N/A'}\nCheck-in: ${doc.hotel?.checkInDate || 'N/A'}\nCheck-out: ${doc.hotel?.checkOutDate || 'N/A'}\nRoom: ${doc.hotel?.roomType || 'N/A'}\nBooking Ref: ${doc.hotel?.bookingRef || 'N/A'}`;
      case 'train':
        return `Document ${idx} — TRAIN TICKET:\nTrain: ${doc.train?.trainName || ''} ${doc.train?.trainNumber || 'N/A'}\nFrom: ${doc.train?.departureStation || 'N/A'} at ${doc.train?.departureTime || 'N/A'}\nTo: ${doc.train?.arrivalStation || 'N/A'} at ${doc.train?.arrivalTime || 'N/A'}\nDate: ${doc.train?.date || 'N/A'}\nClass: ${doc.train?.class || 'N/A'}\nPNR: ${doc.train?.bookingRef || 'N/A'}`;
      case 'bus':
        return `Document ${idx} — BUS TICKET:\nOperator: ${doc.bus?.busOperator || 'N/A'}\nFrom: ${doc.bus?.departure || 'N/A'} at ${doc.bus?.departureTime || 'N/A'}\nTo: ${doc.bus?.arrival || 'N/A'}\nDate: ${doc.bus?.date || 'N/A'}\nSeat: ${doc.bus?.seatNumber || 'N/A'}`;
      default:
        return `Document ${idx} — TRAVEL DOCUMENT (raw text excerpt):\n${doc.rawText?.substring(0, 400) || 'No text extracted'}`;
    }
  });

  return `You are an expert travel planner and itinerary specialist.\n\nThe traveller has uploaded ${extractedDataArray.length} travel booking document(s). Below is the structured information extracted from each document:\n\n${docSummaries.join('\n\n')}\n\nBased ONLY on the information above, generate a comprehensive, well-structured travel itinerary.\n\nReturn ONLY a valid JSON object (no markdown, no code fences, no extra text) matching this exact schema:\n\n{\n  "tripTitle": "string — catchy descriptive title",\n  "destination": "string — primary destination(s)",\n  "startDate": "string — trip start date",\n  "endDate": "string — trip end date",\n  "duration": "number — total days",\n  "summary": "string — 3-4 sentence engaging trip overview",\n  "itineraryDays": [\n    {\n      "day": 1,\n      "date": "string",\n      "title": "string — day theme",\n      "description": "string — detailed day narrative",\n      "activities": ["string"],\n      "meals": ["string — meal suggestion"],\n      "transport": ["string — transport detail"],\n      "accommodation": "string — where to stay",\n      "tips": ["string — insider tip"]\n    }\n  ],\n  "accommodationDetails": "string — full accommodation summary",\n  "transportationDetails": "string — full transport summary",\n  "recommendations": [\n    "string — must-visit attraction or experience"\n  ],\n  "reminders": [\n    "string — important reminder or checklist item"\n  ],\n  "packingSuggestions": [\n    "string — packing item"\n  ],\n  "estimatedBudget": "string — rough budget range based on destinations",\n  "weatherInfo": "string — typical weather and clothing advice"\n}\n\nRules:\n- Be specific and actionable with all suggestions.\n- If dates are known, generate a day-by-day itinerary covering every day of travel.\n- If dates are missing, generate a logical template itinerary.\n- Include at least 5 recommendations, 5 reminders, and 8 packing suggestions.\n- Keep all string values concise but informative.\n- Do NOT include any text outside the JSON object.`;
};

const tryParseJson = (input) => {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Empty response from OpenRouter');
  const cleaned = input.replace(/```json\s*/gi, '').replace(/```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch (e2) { throw new Error('Unable to parse JSON from model response'); }
    }
    throw new Error('Model response does not contain valid JSON');
  }
};

const buildFallbackItinerary = (error) => ({
  tripTitle: 'AI unavailable — manual itinerary required',
  destination: 'Unknown',
  startDate: '',
  endDate: '',
  duration: 0,
  summary: 'The AI service was unavailable to generate a detailed itinerary. Please retry later or plan manually.',
  itineraryDays: [],
  accommodationDetails: 'Unavailable',
  transportationDetails: 'Unavailable',
  recommendations: ['Retry generation later', 'Verify API key and quota', 'Check uploaded documents for completeness', 'Add missing dates or destinations', 'Fallback to manual planning'],
  reminders: ['Ensure OPENROUTER_API_KEY is set', 'Check OpenRouter quota', 'Retry the request after some time', 'Keep raw documents for manual planning', 'Check network connectivity'],
  packingSuggestions: ['Passport/ID', 'Phone charger', 'Medications', 'Comfortable shoes', 'Weather-appropriate layers', 'Toiletries', 'Travel documents folder', 'Local currency/card'],
  estimatedBudget: 'N/A',
  weatherInfo: 'N/A',
});

const generateItinerary = async (extractedDataArray) => {
  if (!Array.isArray(extractedDataArray) || extractedDataArray.length === 0) throw new Error('extractedDataArray must be a non-empty array');

  const prompt = buildPrompt(extractedDataArray);
  const modelName = OPENROUTER_MODEL;
  console.log('OpenRouter Model:', modelName);

  try {
    const client = getClient();
    debug('Sending request to OpenRouter', { model: modelName, promptLength: prompt.length });

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion?.choices?.[0]?.message?.content || completion?.choices?.[0]?.text;
    if (!content || typeof content !== 'string' || !content.trim()) {
      debug('Empty response from OpenRouter', { completion });
      return buildFallbackItinerary(new Error('Empty response from OpenRouter'));
    }

    let parsed;
    try {
      parsed = tryParseJson(content);
    } catch (parsingError) {
      errorLog(parsingError, { model: modelName });
      return buildFallbackItinerary(parsingError);
    }

    return parsed;
  } catch (err) {
    // Handle specific error cases
    try {
      if (err?.response?.status === 401 || /invalid.*key/i.test(err?.message || '')) {
        errorLog('Invalid API key for OpenRouter', { message: err.message });
        return buildFallbackItinerary(new Error('Invalid OpenRouter API key'));
      }
      if (err?.response?.status === 429 || /rate limit/i.test(err?.message || '')) {
        errorLog('OpenRouter rate limited', { message: err.message });
        return buildFallbackItinerary(new Error('Rate limited by OpenRouter'));
      }
    } catch (e) {
      errorLog(e, { stage: 'error-inspection' });
    }

    errorLog(err, { model: modelName });
    return buildFallbackItinerary(err);
  }
};

module.exports = { generateItinerary, buildPrompt, tryParseJson, buildFallbackItinerary };
