// ============================================================
//  codeViewer.js — Syntax-highlighted code viewer
//  Phase 4: Advanced Features
//
//  Uses highlight.js (loaded via CDN in index.html).
// ============================================================

/**
 * Render a file's content into the code viewer with syntax highlighting.
 * Falls back to plain text if highlight.js is unavailable.
 *
 * @param {string} filename  - used to detect the language
 * @param {string} content   - raw source code string
 */
export function displayFile(filename, content) {
  const codeEl   = document.getElementById('codeContent');
  const headerEl = document.getElementById('codeFileHeader');
  if (!codeEl) return;

  if (headerEl) headerEl.textContent = filename;

  // Set raw text first (safe, escaped by the browser)
  codeEl.textContent = content;
  codeEl.removeAttribute('data-highlighted'); // allow hljs to re-run

  if (window.hljs) {
    const lang = _detectLang(filename);
    if (lang) {
      codeEl.className = `language-${lang}`;
    } else {
      codeEl.className = '';
    }
    window.hljs.highlightElement(codeEl);
  }
}

// ─── Language detection ────────────────────────────────────────
function _detectLang(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js:         'javascript',
    jsx:        'javascript',
    ts:         'typescript',
    tsx:        'typescript',
    html:       'html',
    css:        'css',
    scss:       'scss',
    json:       'json',
    md:         'markdown',
    py:         'python',
    go:         'go',
    rs:         'rust',
    java:       'java',
    sh:         'bash',
    bash:       'bash',
    yml:        'yaml',
    yaml:       'yaml',
    sql:        'sql',
    dockerfile: 'dockerfile',
    env:        'bash',
    gitignore:  'bash',
  };
  return map[ext] ?? null;
}
