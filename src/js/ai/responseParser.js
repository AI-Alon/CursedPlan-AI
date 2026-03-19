// ============================================================
//  responseParser.js — Parse + validate LLM JSON output
//  Phase 2: AI Core
// ============================================================

/**
 * Parse the raw LLM text response into a structured project object.
 * Tries multiple strategies to extract JSON because LLMs sometimes
 * wrap it in markdown fences or add extra text.
 *
 * @param {string} raw  - Raw text from the LLM
 * @returns {object}    - Validated project object
 * @throws  {Error}     - If JSON cannot be extracted
 */
export function parseProjectResponse(raw) {
  let parsed = null;

  // Strategy 1: extract from ```json ... ``` fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { parsed = JSON.parse(fenceMatch[1].trim()); } catch { /* try next */ }
  }

  // Strategy 2: parse the entire response as JSON
  if (!parsed) {
    try { parsed = JSON.parse(raw.trim()); } catch { /* try next */ }
  }

  // Strategy 3: find the outermost { ... } block in the text
  if (!parsed) {
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { /* fail */ }
    }
  }

  if (!parsed) {
    throw new Error('Could not parse the AI response as JSON. Please try again.');
  }

  return validate(parsed);
}

// ─── Validate & fill defaults ──────────────────────────────────
function validate(data) {
  return {
    name:        str(data.name,        'Untitled Project'),
    description: str(data.description, 'An AI-generated software project.'),
    techStack:   arr(data.techStack),
    features:    arr(data.features),
    overview:    str(data.overview,    data.description ?? ''),
    diagram:     str(data.diagram,     'flowchart TD\n  A[Project] --> B[Features]'),
    roadmap:     arr(data.roadmap).map(normalizeStep),
    structure:   str(data.structure,   data.folderStructure ?? ''),
    files:       arr(data.files).map(normalizeFile),
    evolution:   arr(data.evolution).map(normalizeEvolution),
  };
}

function normalizeStep(s) {
  return {
    title:       str(s.title,       'Step'),
    subtitle:    str(s.subtitle,    ''),
    description: str(s.description, ''),
    libs:        arr(s.libs),
  };
}

function normalizeFile(f) {
  return {
    name:    str(f.name,    'file.js'),
    content: str(f.content, '// No content'),
  };
}

function normalizeEvolution(e) {
  return {
    category:    str(e.category,    'Feature'),
    title:       str(e.title,       'Improvement'),
    description: str(e.description, ''),
  };
}

// ─── Helpers ──────────────────────────────────────────────────
const str = (v, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
const arr = (v)                 => (Array.isArray(v) ? v : []);
