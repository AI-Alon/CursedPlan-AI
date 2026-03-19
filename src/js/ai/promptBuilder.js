// ============================================================
//  promptBuilder.js — Structured prompt templates
//  Phase 2: AI Core
// ============================================================

/**
 * Build the main project generation prompt.
 * Instructs the LLM to return a strict JSON object with all
 * fields BrainSpark needs to populate every tab.
 *
 * @param {string} idea  - Raw user idea text
 * @returns {string}     - Full prompt string
 */
export function buildProjectPrompt(idea) {
  return `You are a senior software architect. A user has given you a project idea.
Your job is to generate a complete, detailed project blueprint as a single JSON object.

Project idea: "${idea}"

Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.
Use this exact schema:

{
  "name": "Creative catchy startup brand name (e.g. CollabCode, NexusHub, DevFlow) — NOT a plain description",
  "description": "2-3 sentence description of what the project does",
  "techStack": ["Technology1", "Technology2", "Technology3"],
  "features": [
    "Feature one",
    "Feature two",
    "Feature three",
    "Feature four",
    "Feature five",
    "Feature six"
  ],
  "overview": "A detailed paragraph (4-6 sentences) explaining the project architecture, goals, and how it works.",
  "diagram": "flowchart TD\\n    A[User] --> B[Frontend]\\n    B --> C[Backend]\\n    C --> D[Database]",
  "roadmap": [
    {
      "title": "Step title",
      "subtitle": "One-line description",
      "description": "2-3 sentence explanation of what to do in this step.",
      "libs": ["lib1", "lib2", "lib3"]
    }
  ],
  "structure": "ProjectName/\\n├── README.md\\n├── src/\\n│   └── index.js\\n└── package.json",
  "files": [
    {
      "name": "src/index.js",
      "content": "// starter code here"
    }
  ],
  "evolution": [
    {
      "category": "Scalability",
      "title": "Improvement title",
      "description": "2 sentence explanation of the improvement."
    },
    {
      "category": "Security",
      "title": "Improvement title",
      "description": "2 sentence explanation."
    },
    {
      "category": "Performance",
      "title": "Improvement title",
      "description": "2 sentence explanation."
    },
    {
      "category": "Feature",
      "title": "New feature title",
      "description": "2 sentence explanation."
    }
  ]
}

Rules:
- roadmap must have 5 steps
- files must have 3 starter files with real, useful code
- diagram must use Mermaid.js flowchart TD syntax with newlines as \\n
- techStack must have 5-8 technologies
- features must have 6-8 items
- evolution must have exactly 4 items, one per category shown above
- All string values must be properly JSON-escaped
- Return ONLY the JSON object, nothing else`;
}

/**
 * Build a refinement prompt — takes the existing project + user feedback
 * and returns a fully updated project JSON.
 * @param {object} project
 * @param {string} feedback
 * @returns {string}
 */
export function buildRefinePrompt(project, feedback) {
  const current = {
    name:        project.name,
    description: project.description,
    techStack:   project.techStack,
    features:    project.features,
    overview:    project.overview,
  };

  return `You are a senior software architect. A user has a generated project blueprint and wants to refine it.

Current project:
${JSON.stringify(current, null, 2)}

User's refinement request: "${feedback}"

Apply the feedback and return the COMPLETE updated project as a single JSON object.
Return ONLY valid JSON — no markdown, no explanation. Use this exact schema:

{
  "name": "Creative catchy startup brand name",
  "description": "2-3 sentence description",
  "techStack": ["tech1", "tech2"],
  "features": ["feature 1", "feature 2"],
  "overview": "detailed paragraph",
  "diagram": "flowchart TD\\n    A[...] --> B[...]",
  "roadmap": [{"title":"...","subtitle":"...","description":"...","libs":["..."]}],
  "structure": "folder tree as text",
  "files": [{"name":"path/file.ext","content":"code"}],
  "evolution": [{"category":"Scalability","title":"...","description":"..."}]
}

Return ONLY the JSON object, nothing else.`;
}
