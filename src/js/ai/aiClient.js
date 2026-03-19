// ============================================================
//  aiClient.js — Groq API client
//  Phase 2: AI Core
// ============================================================

import { CONFIG } from '../config.js';

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Send a prompt to the LLM and return the raw text response.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function callLLM(prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       CONFIG.MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  const data    = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from Groq');

  return content;
}
