#!/usr/bin/env node

/**
 * Gemini API Connection Verification Script
 * Usage: node tests/verifyGeminiConnection.js
 */

require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-2.0-flash';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
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
    log('cyan', '📋 Gemini Connection Verification Script');
    log('cyan', '🔍 Model:', GEMINI_MODEL);
    log('gray', '━'.repeat(60));

    // Step 1: Check API Key
    log('cyan', '1️⃣ Checking GEMINI_API_KEY environment variable...');
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      log('red', '❌ GEMINI_API_KEY not found in .env file');
      process.exit(1);
    }

    log('green', '✓ API Key found');
    log('gray', `  Key length: ${apiKey.length} characters`);
    log('gray', `  Key prefix: ${apiKey.substring(0, 10)}...`);

    // Step 2: Initialize client
    log('cyan', '2️⃣ Initializing GoogleGenerativeAI client...');
    const client = new GoogleGenerativeAI(apiKey);
    log('green', '✓ Client initialized');

    // Step 3: Get model
    log('cyan', '3️⃣ Getting generative model:', GEMINI_MODEL);
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    log('green', '✓ Model retrieved');

    // Step 4: Send test request
    log('cyan', '4️⃣ Sending test request to Gemini API...');
    const testPrompt = 'Respond with exactly this: "Gemini API connection successful. Ready for production."';

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 100,
      },
    });

    if (!result || !result.response) {
      throw new Error('Invalid response structure from API');
    }

    let responseText;
    if (typeof result.response.text === 'function') {
      responseText = result.response.text();
    } else if (typeof result.response.text === 'string') {
      responseText = result.response.text;
    } else {
      responseText = String(result.response);
    }

    log('green', '✓ Response received');
    log('gray', `  Response: "${responseText.trim().substring(0, 60)}..."`);

    // Step 5: Validate JSON parsing
    log('cyan', '5️⃣ Testing JSON parsing capability...');
    const jsonPrompt = 'Return a JSON object with one field "status" set to "ok". Return ONLY the JSON object.';

    const jsonResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: jsonPrompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 100,
      },
    });

    let jsonText;
    if (typeof jsonResult.response.text === 'function') {
      jsonText = jsonResult.response.text();
    } else if (typeof jsonResult.response.text === 'string') {
      jsonText = jsonResult.response.text;
    } else {
      jsonText = String(jsonResult.response);
    }

    const cleanedJson = jsonText.replace(/```json\s*/gi, '').replace(/```/gi, '').trim();
    const parsed = JSON.parse(cleanedJson);

    if (parsed.status === 'ok') {
      log('green', '✓ JSON parsing works correctly');
    } else {
      throw new Error('JSON parsing validation failed');
    }

    // Success
    log('gray', '━'.repeat(60));
    log('green', '🎉 All verification tests passed!');
    log('green', '✓ Gemini API is ready for production use');
    log('gray', `  Model: ${GEMINI_MODEL}`);
    log('gray', `  API Version: v1beta`);
    log('gray', `  SDK Version: @google/generative-ai@0.24.1`);
    process.exit(0);
  } catch (error) {
    log('gray', '━'.repeat(60));
    log('red', '❌ Verification failed');
    log('red', '  Error:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes('429')) {
      log('yellow', '  ⚠️  Rate limit exceeded. Wait a moment and retry.');
    } else if (error instanceof Error && error.message.includes('401')) {
      log('yellow', '  ⚠️  Invalid API key. Check your GEMINI_API_KEY in .env');
    } else if (error instanceof Error && error.message.includes('404')) {
      log('yellow', '  ⚠️  Model not found or disabled. Verify model name.');
    } else if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      log('yellow', '  ⚠️  Network error. Check your internet connection.');
    }

    if (process.env.DEBUG) {
      log('gray', 'Stack trace:');
      console.error(error instanceof Error ? error.stack : error);
    }

    process.exit(1);
  }
};

main();