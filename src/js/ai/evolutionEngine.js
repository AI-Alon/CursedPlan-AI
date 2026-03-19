// ============================================================
//  evolutionEngine.js — AI project evolution
//  Phase 4: Advanced Features
// ============================================================

import { callLLM } from './aiClient.js';

/**
 * Ask the AI to suggest improvements to the current project.
 * Returns an array of evolution suggestions.
 * @param {object} project
 * @returns {Promise<Array>}
 */
export async function evolveProject(project) {
  const prompt = _buildEvolutionPrompt(project);
  const raw    = await callLLM(prompt);
  return _parseEvolutionResponse(raw);
}

// ─── Prompt ────────────────────────────────────────────────────
function _buildEvolutionPrompt(project) {
  const summary = {
    name:        project.name,
    description: project.description,
    techStack:   project.techStack,
    features:    project.features,
  };

  return `You are a senior software architect reviewing an existing project.
Suggest 6 concrete, actionable improvements to make it more production-ready.

Current project:
${JSON.stringify(summary, null, 2)}

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "category": "Scalability",
    "title": "Specific improvement title",
    "description": "2-3 sentences explaining what to do and why it matters."
  }
]

Categories to cover (one each): Scalability, Security, Performance, Feature, DevOps, Testing.
Return ONLY the JSON array, nothing else.`;
}

// ─── Parser ────────────────────────────────────────────────────
function _parseEvolutionResponse(raw) {
  let parsed = null;

  // Try ```json fences
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { parsed = JSON.parse(fence[1].trim()); } catch { /* next */ }
  }

  // Try raw parse
  if (!parsed) {
    try { parsed = JSON.parse(raw.trim()); } catch { /* next */ }
  }

  // Try finding [ ... ] array
  if (!parsed) {
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start !== -1 && end > start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { /* fail */ }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Could not parse evolution suggestions. Please try again.');
  }

  return parsed.map((e) => ({
    category:    String(e.category    ?? 'Feature'),
    title:       String(e.title       ?? 'Improvement'),
    description: String(e.description ?? ''),
  }));
}
