// ─────────────────────────────────────────────────────────────
//  config/ai.js  – Grok AI (xAI) client configuration
// ─────────────────────────────────────────────────────────────

const axios = require('axios');

const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
const GROK_MODEL    = process.env.GROK_MODEL    || 'grok-2-latest';
const MAX_TOKENS    = parseInt(process.env.MAX_TOKENS || '1024');

function getApiKey() {
  const key = process.env.GROK_API_KEY;
  if (!key || key === 'your_grok_api_key_here') {
    throw new Error('GROK_API_KEY is not configured. Please set it in your .env file.');
  }
  return key;
}

function createGrokClient() {
  return axios.create({
    baseURL: GROK_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`
    },
    timeout: 30000
  });
}

module.exports = { createGrokClient, GROK_MODEL, MAX_TOKENS };
