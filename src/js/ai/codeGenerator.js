// ============================================================
//  codeGenerator.js — Starter code generation
//  Phase 4: Advanced Features
// ============================================================

import { callLLM } from './aiClient.js';

/**
 * Generate detailed starter code files for the project.
 * @param {object} project
 * @returns {Promise<Array<{name: string, content: string}>>}
 */
export async function generateCode(project) {
  const prompt = _buildCodePrompt(project);
  const raw    = await callLLM(prompt);
  return _parseCodeResponse(raw);
}

// ─── Prompt ────────────────────────────────────────────────────
function _buildCodePrompt(project) {
  const summary = {
    name:        project.name,
    description: project.description,
    techStack:   project.techStack,
    features:    project.features.slice(0, 5),
  };

  return `You are a senior developer. Generate production-quality starter code for this project.

Project:
${JSON.stringify(summary, null, 2)}

Return ONLY a valid JSON array of 4 files — no markdown, no explanation:
[
  {
    "name": "relative/path/to/file.ext",
    "content": "full file content as a string"
  }
]

Rules:
- Include real, working code — not just comments or placeholders
- Cover the main entry point, a core module, a config file, and a README
- Use the appropriate language for each file based on the tech stack
- Escape all special characters properly for JSON
- Return ONLY the JSON array, nothing else`;
}

// ─── Parser ────────────────────────────────────────────────────
function _parseCodeResponse(raw) {
  let parsed = null;

  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { parsed = JSON.parse(fence[1].trim()); } catch { /* next */ }
  }

  if (!parsed) {
    try { parsed = JSON.parse(raw.trim()); } catch { /* next */ }
  }

  if (!parsed) {
    const start = raw.indexOf('[');
    const end   = raw.lastIndexOf(']');
    if (start !== -1 && end > start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { /* fail */ }
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Could not parse generated code. Please try again.');
  }

  return parsed
    .filter((f) => f.name && f.content)
    .map((f) => ({
      name:    String(f.name).trim(),
      content: String(f.content),
    }));
}
