// ============================================================
//  storage.js — localStorage project history manager
//  Phase 3: Core Features
// ============================================================

const KEY     = 'brainspark_history';
const MAX     = 10;

/**
 * Save a generated project to history.
 * Newest entry is first; trims to MAX entries.
 * @param {object} project
 */
export function saveProject(project) {
  const history = getProjects();
  const entry = {
    id:          Date.now(),
    name:        project.name,
    description: project.description.slice(0, 110) + '…',
    techStack:   project.techStack.slice(0, 3),
    date:        new Date().toLocaleDateString(),
    project,
  };
  const updated = [entry, ...history].slice(0, MAX);
  _write(updated);
}

/**
 * Return all saved project entries (newest first).
 * @returns {Array}
 */
export function getProjects() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * Delete a single entry by id.
 * @param {number} id
 */
export function deleteProject(id) {
  _write(getProjects().filter((e) => e.id !== id));
}

/**
 * Delete all saved entries.
 */
export function clearProjects() {
  localStorage.removeItem(KEY);
}

// ─── Internal ─────────────────────────────────────────────────
function _write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
