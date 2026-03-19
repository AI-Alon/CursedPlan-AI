// ============================================================
//  helpers.js — Shared utility functions
//  Phase 3: Core Features
// ============================================================

/** Pause execution for `ms` milliseconds. */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Show a bottom-right toast notification.
 * @param {string} message
 * @param {'default'|'error'|'success'} type
 */
export function showToast(message, type = 'default') {
  document.querySelector('.bs-toast')?.remove();

  const colors = {
    default: { bg: 'var(--purple)',  shadow: 'rgba(124,58,237,0.4)'  },
    error:   { bg: 'var(--red)',     shadow: 'rgba(239,68,68,0.4)'   },
    success: { bg: 'var(--green)',   shadow: 'rgba(16,185,129,0.4)'  },
  };
  const c = colors[type] ?? colors.default;

  const toast = Object.assign(document.createElement('div'), {
    className:   'bs-toast',
    textContent: message,
  });
  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    background:   c.bg,
    color:        '#fff',
    padding:      '11px 20px',
    borderRadius: '10px',
    fontSize:     '0.875rem',
    fontFamily:   "'Comic Sans MS', cursive",
    fontWeight:   '500',
    zIndex:       '999',
    animation:    'fadeInUp 0.3s ease',
    boxShadow:    `0 4px 16px ${c.shadow}`,
    maxWidth:     '340px',
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

/**
 * Copy text to clipboard and show a toast.
 * @param {string} text
 * @param {string} label  - shown in the success toast
 */
export async function copyToClipboard(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✓ ${label}`, 'success');
  } catch {
    showToast('Could not copy — try manually', 'error');
  }
}

/**
 * Return a file-type icon emoji based on the file extension.
 * @param {string} filename
 * @returns {string}
 */
export function fileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: '🟨', jsx: '🟨', ts: '🔷', tsx: '🔷',
    html: '🟧', css: '🎨', scss: '🎨',
    json: '📋', md: '📝', yml: '⚙️', yaml: '⚙️',
    py: '🐍', go: '🐹', rs: '🦀', java: '☕',
    sh: '🖥️', env: '🔑', gitignore: '🙈',
    dockerfile: '🐳', sql: '🗄️',
  };
  return map[ext] ?? '📄';
}
