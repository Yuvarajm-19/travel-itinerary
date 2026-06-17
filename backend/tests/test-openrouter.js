require('dotenv').config();
const OpenAI = require('openai');

async function run() {
  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY not set in .env');

    const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: key });
    const model = process.env.OPENROUTER_MODEL || 'openrouter/auto';
    console.log('OpenRouter Model:', model);

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say hello in one concise sentence.' }],
      temperature: 0.2,
      max_tokens: 50,
    });

    const content = completion?.choices?.[0]?.message?.content || completion?.choices?.[0]?.text;
    console.log('Response:', content);
    process.exit(0);
  } catch (err) {
    console.error('OpenRouter test failed:', err instanceof Error ? err.stack : err);
    process.exit(1);
  }
}

run();
