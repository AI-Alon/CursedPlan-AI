// ============================================================
//  githubExporter.js — ZIP download & GitHub-ready export
//  Phase 4: Advanced Features
//
//  Uses JSZip (loaded via CDN in index.html).
// ============================================================

/**
 * Build and download a GitHub-ready ZIP for the project.
 * Includes: README.md, LICENSE, .gitignore, CONTRIBUTING.md,
 *           CHANGELOG.md, docs/architecture.md, and all code files.
 * @param {object} project
 */
export async function exportToZip(project) {
  if (!window.JSZip) {
    throw new Error('JSZip failed to load. Check your internet connection.');
  }

  const zip      = new window.JSZip();
  const name     = _slug(project.name);
  const folder   = zip.folder(name);

  // ── Core docs ──────────────────────────────────────────────
  folder.file('README.md',       _buildReadme(project));
  folder.file('LICENSE',         _buildLicense());
  folder.file('.gitignore',      _buildGitignore(project.techStack));
  folder.file('CONTRIBUTING.md', _buildContributing(project));
  folder.file('CHANGELOG.md',    _buildChangelog(project));

  // ── Docs folder ────────────────────────────────────────────
  const docs = folder.folder('docs');
  docs.file('architecture.md', _buildArchitectureDocs(project));
  docs.file('roadmap.md',      _buildRoadmapDocs(project));

  // ── Starter code files ─────────────────────────────────────
  (project.files ?? []).forEach((file) => {
    folder.file(file.name, file.content);
  });

  // ── GitHub templates ───────────────────────────────────────
  const gh        = folder.folder('.github');
  const templates = gh.folder('ISSUE_TEMPLATE');
  templates.file('bug_report.md',       _bugReportTemplate(project));
  templates.file('feature_request.md',  _featureRequestTemplate(project));
  gh.file('workflows/deploy.yml',       _deployWorkflow(project));

  // ── Generate & download ────────────────────────────────────
  const blob = await zip.generateAsync({ type: 'blob' });
  _downloadBlob(blob, `${name}.zip`);
}

// ─── README.md ─────────────────────────────────────────────────
function _buildReadme(p) {
  const stack = p.techStack.join(' • ');
  const features = p.features.map((f) => `- ${f}`).join('\n');
  const roadmap  = (p.roadmap ?? [])
    .map((s, i) => `### ${i + 1}. ${s.title}\n${s.description}`)
    .join('\n\n');

  return `# ${p.name}

> ${p.description}

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![Built with AI](https://img.shields.io/badge/built%20with-BrainSpark%20AI-purple.svg)

---

## 📖 Overview

${p.overview}

---

## 🛠 Tech Stack

${stack}

---

## ✨ Features

${features}

---

## 🏗 Architecture

\`\`\`mermaid
${(p.diagram ?? '').replace(/\\n/g, '\n')}
\`\`\`

---

## 🗺 Development Roadmap

${roadmap}

---

## 📂 Project Structure

\`\`\`
${p.structure ?? ''}
\`\`\`

---

## 🚀 Getting Started

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/${_slug(p.name)}.git
cd ${_slug(p.name)}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

[MIT](LICENSE) © ${new Date().getFullYear()}

---

*Generated with [BrainSpark](https://github.com/brainspark) — Turn any idea into a full software project in seconds.*
`;
}

// ─── LICENSE ───────────────────────────────────────────────────
function _buildLicense() {
  const year = new Date().getFullYear();
  return `MIT License

Copyright (c) ${year}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

// ─── .gitignore ────────────────────────────────────────────────
function _buildGitignore(techStack = []) {
  const lines = [
    '# Dependencies',
    'node_modules/',
    '.pnp',
    '.pnp.js',
    '',
    '# Environment',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# Build output',
    'dist/',
    'build/',
    '.next/',
    'out/',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
    '',
    '# OS',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.suo',
    '*.ntvs*',
  ];

  const stack = techStack.join(' ').toLowerCase();
  if (stack.includes('python')) {
    lines.push('', '# Python', '__pycache__/', '*.pyc', '*.pyo', 'venv/', '.venv/');
  }
  if (stack.includes('docker')) {
    lines.push('', '# Docker', '*.dockerignore');
  }

  return lines.join('\n');
}

// ─── CONTRIBUTING.md ───────────────────────────────────────────
function _buildContributing(p) {
  return `# Contributing to ${p.name}

Thank you for considering a contribution! Here's how to get started.

## How to Contribute

1. **Fork** the repository
2. **Create a branch**: \`git checkout -b feature/your-feature-name\`
3. **Make your changes** and write tests if applicable
4. **Commit**: \`git commit -m "feat: add your feature"\`
5. **Push**: \`git push origin feature/your-feature-name\`
6. **Open a Pull Request** against \`main\`

## Code Style

- Keep functions small and focused
- Write clear commit messages (use [Conventional Commits](https://www.conventionalcommits.org/))
- Add comments for non-obvious logic

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## Requesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
`;
}

// ─── CHANGELOG.md ──────────────────────────────────────────────
function _buildChangelog(p) {
  const date = new Date().toISOString().split('T')[0];
  return `# Changelog

All notable changes to **${p.name}** will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - ${date}

### Added
${p.features.map((f) => `- ${f}`).join('\n')}

### Tech Stack
${p.techStack.map((t) => `- ${t}`).join('\n')}
`;
}

// ─── docs/architecture.md ──────────────────────────────────────
function _buildArchitectureDocs(p) {
  return `# Architecture — ${p.name}

## Overview

${p.overview}

## System Diagram

\`\`\`mermaid
${(p.diagram ?? '').replace(/\\n/g, '\n')}
\`\`\`

## Tech Stack

| Technology | Purpose |
|------------|---------|
${p.techStack.map((t) => `| ${t} | — |`).join('\n')}
`;
}

// ─── docs/roadmap.md ───────────────────────────────────────────
function _buildRoadmapDocs(p) {
  const steps = (p.roadmap ?? [])
    .map(
      (s, i) => `## Step ${i + 1}: ${s.title}

**${s.subtitle}**

${s.description}

**Libraries:** ${(s.libs ?? []).join(', ') || '—'}
`
    )
    .join('\n---\n\n');

  return `# Development Roadmap — ${p.name}\n\n${steps}`;
}

// ─── GitHub issue templates ────────────────────────────────────
function _bugReportTemplate(p) {
  return `---
name: Bug report
about: Report a bug in ${p.name}
title: '[BUG] '
labels: bug
---

## Describe the bug
A clear description of what the bug is.

## Steps to reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected behaviour
What you expected to happen.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g. macOS 14]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
`;
}

function _featureRequestTemplate(p) {
  return `---
name: Feature request
about: Suggest a new feature for ${p.name}
title: '[FEAT] '
labels: enhancement
---

## Is your feature request related to a problem?
A clear description of the problem.

## Describe the solution you'd like
A clear description of what you want to happen.

## Alternatives considered
Any alternative solutions or features you've considered.

## Additional context
Any other context or screenshots about the feature request.
`;
}

// ─── GitHub Actions deploy workflow ───────────────────────────
function _deployWorkflow(p) {
  return `name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
`;
}

// ─── Project Plan MD export ────────────────────────────────────

/**
 * Generate and download a project-plan.md file — comprehensive
 * markdown doc ready to paste into any LLM as context.
 * @param {object} project
 */
export function downloadProjectPlan(project) {
  const md = _buildProjectPlanMd(project);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  _downloadBlob(blob, 'project-plan.md');
}

function _buildProjectPlanMd(p) {
  const diagram   = (p.diagram ?? '').replace(/\\n/g, '\n');
  const roadmap   = (p.roadmap ?? [])
    .map((s, i) => `### Step ${i + 1}: ${s.title}
**${s.subtitle}**

${s.description}

**Libraries / Tools:** ${(s.libs ?? []).join(', ') || '—'}`)
    .join('\n\n---\n\n');

  const files = (p.files ?? [])
    .map((f) => {
      const ext = f.name.split('.').pop();
      return `#### \`${f.name}\`\n\`\`\`${ext}\n${f.content}\n\`\`\``;
    })
    .join('\n\n');

  const evolution = (p.evolution ?? [])
    .map((e) => `- **[${e.category}] ${e.title}:** ${e.description}`)
    .join('\n');

  return `# ${p.name} — Project Plan

> Generated by [BrainSpark](https://github.com/brainspark) on ${new Date().toLocaleDateString()}

---

## Overview

${p.overview}

---

## Description

${p.description}

---

## Tech Stack

${p.techStack.map((t) => `- ${t}`).join('\n')}

---

## Core Features

${p.features.map((f) => `- ${f}`).join('\n')}

---

## System Architecture

\`\`\`mermaid
${diagram}
\`\`\`

---

## Development Roadmap

${roadmap}

---

## Folder Structure

\`\`\`
${p.structure ?? ''}
\`\`\`

---

## Starter Code Files

${files}

---

## AI Evolution Suggestions

${evolution}

---

## How to Use This File

Paste this entire document into any LLM (ChatGPT, Claude, Gemini, etc.) with a prompt like:

> "Here is my project plan. Help me implement Step 1."
> "Review this architecture and suggest improvements."
> "Generate tests for the files in this project plan."
`;
}

// ─── Utilities ─────────────────────────────────────────────────
function _slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function _downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), {
    href:     url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
