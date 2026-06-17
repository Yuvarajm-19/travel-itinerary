const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract plain text from a PDF file.
 * @param {string} filePath  Absolute path to the PDF
 * @returns {Promise<string>}
 */
const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text?.trim() || '';
};

/**
 * Extract plain text from an image file using Tesseract.js.
 * @param {string} filePath  Absolute path to the image
 * @returns {Promise<string>}
 */
const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {}, // suppress progress logs
  });
  return result.data.text?.trim() || '';
};

// ── Document type classifier ──────────────────────────────────────────────────

/**
 * Determine the type of travel document from its raw text.
 * @param {string} text
 * @returns {'flight' | 'hotel' | 'train' | 'bus' | 'other'}
 */
const classifyDocumentType = (text) => {
  const lower = text.toLowerCase();

  const scores = {
    flight: 0,
    hotel:  0,
    train:  0,
    bus:    0,
  };

  // Flight keywords
  if (/\b(flight|airline|boarding pass|aircraft|terminal|gate|pnr|e-ticket)\b/.test(lower)) scores.flight += 3;
  if (/\b(departs?|arrives?|departure|arrival)\b/.test(lower)) scores.flight += 1;
  if (/[A-Z]{2}\d{3,4}/.test(text)) scores.flight += 2; // flight number pattern

  // Hotel keywords
  if (/\b(hotel|resort|inn|lodge|check-in|check-out|checkout|checkin|room|accommodation)\b/.test(lower)) scores.hotel += 3;
  if (/\b(nights?|bed|breakfast|amenities|reservation)\b/.test(lower)) scores.hotel += 1;

  // Train keywords
  if (/\b(train|railway|rail|station|platform|coach|berth|irctc|amtrak|eurorail|rajdhani|shatabdi)\b/.test(lower)) scores.train += 4;
  if (/\bpnr\b/.test(lower)) scores.train += 3; // PNR is railway-specific
  if (/\b(seat|class|sleeper|express|intercity)\b/.test(lower)) scores.train += 1;

  // Bus keywords
  if (/\b(bus|coach|greyhound|redbus|seat|operator|boarding point)\b/.test(lower)) scores.bus += 3;
  if (/\b(departure point|arrival point)\b/.test(lower)) scores.bus += 1;

  const max = Math.max(...Object.values(scores));
  if (max === 0) return 'other';

  return Object.keys(scores).find((k) => scores[k] === max);
};

// ── Field extractors ──────────────────────────────────────────────────────────

const extractFlightData = (text) => {
  const data = {};

  // Airline name (common carriers)
  const airlineMatch = text.match(
    /\b(Air India|IndiGo|SpiceJet|Vistara|GoAir|AirAsia|Emirates|Etihad|Qatar Airways|British Airways|Lufthansa|Delta|United|American Airlines|Southwest|Air France|Singapore Airlines|Cathay Pacific|Thai Airways)\b/i
  );
  data.airline = airlineMatch ? airlineMatch[0] : extractByLabel(text, /airline[:\s]+([^\n]+)/i);

  // Flight number
  const flightNumMatch = text.match(/\b([A-Z]{1,3}[\s-]?\d{1,4})\b/);
  data.flightNumber = flightNumMatch ? flightNumMatch[1].trim() : extractByLabel(text, /flight\s*(no|number|#)?[:\s]+([^\n]+)/i, 2);

  // Cities
  data.departureCity = extractByLabel(text, /(?:from|origin|departure\s*city)[:\s]+([^\n,]+)/i) ||
                       extractByLabel(text, /depart(?:ing|ure)?[:\s]+([^\n,]+)/i);
  data.arrivalCity   = extractByLabel(text, /(?:to|destination|arrival\s*city)[:\s]+([^\n,]+)/i) ||
                       extractByLabel(text, /arriv(?:ing|al)?[:\s]+([^\n,]+)/i);

  // Dates & times
  data.departureDate = extractDate(text, /(?:departure|depart|from)\s*(?:date)?[:\s]+([^\n]+)/i) || extractFirstDate(text);
  data.departureTime = extractTime(text, /(?:departure|departs?)\s*(?:time)?[:\s]+([^\n]+)/i);
  data.arrivalTime   = extractTime(text, /(?:arrival|arrives?)\s*(?:time)?[:\s]+([^\n]+)/i);

  data.terminal   = extractByLabel(text, /terminal[:\s]+([^\n]+)/i);
  data.bookingRef = extractByLabel(text, /(?:booking\s*ref(?:erence)?|pnr|reservation\s*(?:no|number)|confirmation)[:\s]+([A-Z0-9]{5,10})/i);

  return data;
};

const extractHotelData = (text) => {
  const data = {};

  data.hotelName    = extractByLabel(text, /(?:hotel|property|resort|inn)[:\s]+([^\n]+)/i) ||
                      extractByLabel(text, /(?:welcome to|staying at)[:\s]+([^\n]+)/i);
  data.checkInDate  = extractDate(text, /check[\s-]?in\s*(?:date)?[:\s]+([^\n]+)/i);
  data.checkOutDate = extractDate(text, /check[\s-]?out\s*(?:date)?[:\s]+([^\n]+)/i);
  data.address      = extractByLabel(text, /(?:address|location)[:\s]+([^\n]+)/i);
  data.roomType     = extractByLabel(text, /(?:room\s*type|room\s*category|accommodation)[:\s]+([^\n]+)/i);
  data.bookingRef   = extractByLabel(text, /(?:booking\s*(?:ref(?:erence)?|id|no)|reservation\s*(?:no|number)|confirmation)[:\s]+([A-Z0-9\-]{4,20})/i);

  return data;
};

const extractTrainData = (text) => {
  const data = {};

  data.trainNumber      = extractByLabel(text, /train\s*(?:no|number|#)?[:\s]+([^\n]+)/i);
  data.trainName        = extractByLabel(text, /train\s*name[:\s]+([^\n]+)/i);
  data.departureStation = extractByLabel(text, /(?:from|departure\s*station|boarding)[:\s]+([^\n,]+)/i);
  data.arrivalStation   = extractByLabel(text, /(?:to|arrival\s*station|destination)[:\s]+([^\n,]+)/i);
  data.date             = extractDate(text, /(?:journey\s*date|date\s*of\s*travel|travel\s*date|date)[:\s]+([^\n]+)/i) || extractFirstDate(text);
  data.departureTime    = extractTime(text, /(?:departure|departs?)\s*(?:time)?[:\s]+([^\n]+)/i);
  data.arrivalTime      = extractTime(text, /(?:arrival|arrives?)\s*(?:time)?[:\s]+([^\n]+)/i);
  data.class            = extractByLabel(text, /(?:class|coach|type)[:\s]+([^\n]+)/i);
  data.bookingRef       = extractByLabel(text, /(?:pnr|booking\s*(?:ref(?:erence)?|no)|confirmation)[:\s]+([A-Z0-9]{6,12})/i);

  return data;
};

const extractBusData = (text) => {
  const data = {};

  data.busOperator   = extractByLabel(text, /(?:operator|bus\s*company|service)[:\s]+([^\n]+)/i);
  data.departure     = extractByLabel(text, /(?:from|departure|boarding\s*point)[:\s]+([^\n,]+)/i);
  data.arrival       = extractByLabel(text, /(?:to|arrival|destination|drop\s*point)[:\s]+([^\n,]+)/i);
  data.date          = extractDate(text, /(?:journey|travel|departure|date)[:\s]+([^\n]+)/i) || extractFirstDate(text);
  data.departureTime = extractTime(text, /(?:departure|departs?)\s*(?:time)?[:\s]+([^\n]+)/i);
  data.seatNumber    = extractByLabel(text, /(?:seat\s*(?:no|number|#))[:\s]+([^\n]+)/i);
  data.bookingRef    = extractByLabel(text, /(?:booking\s*(?:id|ref(?:erence)?|no)|ticket\s*(?:no|number)|pnr)[:\s]+([A-Z0-9\-]{4,20})/i);

  return data;
};

// ── Micro-helpers ─────────────────────────────────────────────────────────────

/**
 * Extract a captured group from a regex match.
 * @param {string} text
 * @param {RegExp} pattern
 * @param {number} group  Capture group index (default 1)
 */
const extractByLabel = (text, pattern, group = 1) => {
  const match = text.match(pattern);
  return match ? match[group]?.trim() || null : null;
};

/** Extract a date string using a contextual regex. */
const extractDate = (text, pattern) => {
  const match = text.match(pattern);
  if (!match) return null;
  const raw = match[1]?.trim();
  // Try to find a date sub-pattern within the raw capture
  const dateMatch = raw?.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{2,4}/i);
  return dateMatch ? dateMatch[0].trim() : raw || null;
};

/** Find the first date-like string in the entire text. */
const extractFirstDate = (text) => {
  const match = text.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
};

/** Extract a time string using a contextual regex. */
const extractTime = (text, pattern) => {
  const match = text.match(pattern);
  if (!match) return null;
  const raw = match[1]?.trim();
  const timeMatch = raw?.match(/\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/);
  return timeMatch ? timeMatch[0].trim() : null;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main entry point.  Process a single uploaded file, extract raw text via OCR,
 * classify the document, then extract structured fields.
 *
 * @param {object} file  Multer file object
 * @returns {Promise<object>} Structured extraction result
 */
const processDocument = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  let rawText = '';

  // 1. Extract text
  try {
    if (ext === '.pdf') {
      rawText = await extractTextFromPDF(file.path);
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      rawText = await extractTextFromImage(file.path);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    console.error(`OCR error for ${file.originalname}:`, err.message);
    rawText = '';
  }

  // 2. Classify
  const documentType = classifyDocumentType(rawText);

  // 3. Extract structured fields
  let structuredData = {};
  switch (documentType) {
    case 'flight': structuredData = { flight: extractFlightData(rawText) }; break;
    case 'hotel':  structuredData = { hotel:  extractHotelData(rawText) };  break;
    case 'train':  structuredData = { train:  extractTrainData(rawText) };  break;
    case 'bus':    structuredData = { bus:    extractBusData(rawText) };    break;
    default:       structuredData = {};
  }

  return {
    documentType,
    rawText,
    fileName: file.originalname,
    fileType: ext.replace('.', ''),
    ...structuredData,
  };
};

module.exports = { processDocument, classifyDocumentType };
