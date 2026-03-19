// ============================================================
//  diagramRenderer.js — Mermaid.js rendering engine
//  Phase 3: Core Features
// ============================================================

/** Initialise Mermaid with BrainSpark's dark theme. */
export function initMermaid() {
  if (!window.mermaid) return;
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor:        '#7c3aed',
      primaryTextColor:    '#f8fafc',
      primaryBorderColor:  '#a855f7',
      lineColor:           '#475569',
      secondaryColor:      '#0c0c1a',
      tertiaryColor:       '#111128',
      background:          '#07070f',
      mainBkg:             '#0c0c1a',
      nodeBorder:          '#a855f7',
      clusterBkg:          '#111128',
      titleColor:          '#f8fafc',
      edgeLabelBackground: '#0c0c1a',
      fontSize:            '14px',
    },
  });
}

/**
 * Render the Mermaid architecture diagram into #mermaidDiagram.
 * Uses mermaid.render() (async) for proper error handling.
 * @param {object} project
 */
export async function renderDiagram(project) {
  const container = document.getElementById('mermaidDiagram');
  if (!container) return;

  if (!window.mermaid) {
    container.innerHTML = _errorCard('Mermaid.js failed to load. Check your internet connection.');
    return;
  }

  // Normalise newlines — LLM sometimes returns \\n as literal two chars
  const code = (project.diagram ?? '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .trim();

  if (!code) {
    container.innerHTML = _errorCard('No diagram was generated for this project.');
    return;
  }

  container.innerHTML = '<div style="color:var(--text-3);font-family:\'Comic Sans MS\',cursive">Rendering diagram…</div>';

  try {
    const id = 'bs-diagram-' + Date.now();
    const { svg } = await window.mermaid.render(id, code);
    container.innerHTML = svg;
  } catch (err) {
    container.innerHTML = _errorCard(
      `Could not render diagram — the AI may have returned invalid Mermaid syntax.`,
      code
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function _errorCard(message, rawCode = '') {
  return `
    <div style="text-align:center; padding:32px; color:var(--text-3);">
      <div style="font-size:2rem; margin-bottom:12px;">⚠️</div>
      <p style="font-family:'Comic Sans MS',cursive; margin-bottom:${rawCode ? '16px' : '0'}">${message}</p>
      ${rawCode ? `<pre style="text-align:left;font-size:0.75rem;color:var(--text-3);overflow:auto;max-height:200px;padding:12px;background:var(--glass);border-radius:8px">${_escape(rawCode)}</pre>` : ''}
    </div>`;
}

function _escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
