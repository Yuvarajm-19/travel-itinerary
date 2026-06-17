#!/usr/bin/env node

/**
 * Standalone Gemini API Test Script
 * Tests itinerary generation with sample data
 * Usage: node test-gemini.js
 */

require('dotenv').config();
const { generateItinerary } = require('./src/services/geminiService');

const sampleExtractedData = [
  {
    documentType: 'flight',
    flight: {
      airline: 'United Airlines',
      flightNumber: 'UA123',
      departureCity: 'New York',
      departureDate: '2024-06-15',
      departureTime: '10:00 AM',
      arrivalCity: 'London',
      arrivalTime: '10:30 PM',
      bookingRef: 'ABC123DEF',
    },
  },
  {
    documentType: 'hotel',
    hotel: {
      hotelName: 'The Ritz London',
      address: '150 Piccadilly, London W1J 9BR',
      checkInDate: '2024-06-15',
      checkOutDate: '2024-06-20',
      roomType: 'Deluxe Suite',
      bookingRef: 'RITZ456789',
    },
  },
  {
    documentType: 'train',
    train: {
      trainName: 'Eurostar',
      trainNumber: 'ES9015',
      departureStation: 'London St Pancras',
      departureDate: '2024-06-20',
      departureTime: '2:00 PM',
      arrivalStation: 'Paris Gare du Nord',
      arrivalTime: '4:00 PM',
      date: '2024-06-20',
      bookingRef: 'EURO123456',
    },
  },
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = (level, message, data = '') => {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  const prefix = `${color}[${timestamp}]${colors.reset}`;
  console.log(`${prefix} ${message} ${data}`);
};

const main = async () => {
  try {
    log('cyan', '🧳 Gemini Itinerary Generation Test');
    log('cyan', '━'.repeat(70));

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set in .env file');
    }

    log('green', '✓ GEMINI_API_KEY found');
    log('gray', `  Key length: ${process.env.GEMINI_API_KEY.length} characters`);
    log('cyan', '');

    // Call generateItinerary
    log('blue', '📝 Sending sample travel documents to Gemini...');
    log('gray', `  Documents: ${sampleExtractedData.length}`);
    log('gray', `  Types: ${sampleExtractedData.map(d => d.documentType).join(', ')}`);
    log('cyan', '');

    const startTime = Date.now();
    const itinerary = await generateItinerary(sampleExtractedData);
    const elapsedMs = Date.now() - startTime;

    log('green', '✓ Itinerary generated successfully');
    log('gray', `  Time: ${elapsedMs}ms`);
    log('cyan', '');

    // Display results
    log('blue', '📋 Generated Itinerary:');
    log('gray', '━'.repeat(70));
    log('yellow', `Title: ${itinerary.tripTitle || 'N/A'}`);
    log('yellow', `Destination: ${itinerary.destination || 'N/A'}`);
    log('yellow', `Duration: ${itinerary.duration || 'N/A'} days`);
    log('yellow', `Dates: ${itinerary.startDate || 'N/A'} to ${itinerary.endDate || 'N/A'}`);
    log('gray', '');
    log('yellow', `Summary: ${(itinerary.summary || 'N/A').substring(0, 120)}...`);
    log('gray', '');
    log('yellow', `Days planned: ${(itinerary.itineraryDays || []).length}`);
    log('yellow', `Recommendations: ${(itinerary.recommendations || []).length}`);
    log('yellow', `Reminders: ${(itinerary.reminders || []).length}`);
    log('yellow', `Packing suggestions: ${(itinerary.packingSuggestions || []).length}`);
    log('gray', '');

    // Show first day if available
    if (itinerary.itineraryDays && itinerary.itineraryDays.length > 0) {
      const day1 = itinerary.itineraryDays[0];
      log('cyan', 'First Day Example:');
      log('gray', `  Day ${day1.day}: ${day1.title || 'N/A'}`);
      log('gray', `  Activities: ${(day1.activities || []).slice(0, 3).join(', ')}`);
    }

    // Validate structure
    log('cyan', '');
    log('blue', '✔️ Structure Validation:');
    const validationChecks = [
      ['tripTitle', typeof itinerary.tripTitle === 'string'],
      ['destination', typeof itinerary.destination === 'string'],
      ['startDate', typeof itinerary.startDate === 'string'],
      ['endDate', typeof itinerary.endDate === 'string'],
      ['duration', typeof itinerary.duration === 'number'],
      ['summary', typeof itinerary.summary === 'string'],
      ['itineraryDays', Array.isArray(itinerary.itineraryDays)],
      ['recommendations', Array.isArray(itinerary.recommendations)],
      ['reminders', Array.isArray(itinerary.reminders)],
      ['packingSuggestions', Array.isArray(itinerary.packingSuggestions)],
    ];

    let allValid = true;
    for (const [field, isValid] of validationChecks) {
      const icon = isValid ? '✓' : '✗';
      const color = isValid ? 'green' : 'red';
      log(color, `  ${icon} ${field}: ${isValid ? 'OK' : 'FAILED'}`);
      if (!isValid) allValid = false;
    }

    log('cyan', '');
    log('gray', '━'.repeat(70));
    if (allValid) {
      log('green', '🎉 Test passed! Gemini integration is working correctly.');
    } else {
      log('yellow', '⚠️  Some validation checks failed. Review the structure.');
    }

    // Full JSON output in debug mode
    if (process.env.DEBUG) {
      log('cyan', '');
      log('gray', 'Full JSON Response (DEBUG):');
      console.log(JSON.stringify(itinerary, null, 2));
    }

    process.exit(allValid ? 0 : 1);
  } catch (error) {
    log('cyan', '');
    log('gray', '━'.repeat(70));
    log('red', '❌ Test failed');
    log('red', `  Error: ${error instanceof Error ? error.message : error}`);

    if (error instanceof Error && error.stack && process.env.DEBUG) {
      log('gray', 'Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { generateItinerary };
