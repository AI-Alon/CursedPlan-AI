// ============================================================
//  renderEngine.js — All UI panel rendering
//  Phase 3: Core Features
// ============================================================

import { fileIcon } from '../utils/helpers.js';
import { displayFile } from './codeViewer.js';

// ─── Project header ────────────────────────────────────────────
export function renderHeader(p) {
  document.getElementById('projectName').textContent = p.name;
  document.getElementById('projectDesc').textContent = p.description;
  document.title = `${p.name} — BrainSpark`;

  const shown = p.techStack.slice(0, 5);
  const extra = p.techStack.length - 5;
  document.getElementById('projectTags').innerHTML =
    shown.map((t) => `<span class="tag">${_esc(t)}</span>`).join('') +
    (extra > 0 ? `<span class="tag">+${extra} more</span>` : '');
}

// ─── Plan tab ──────────────────────────────────────────────────
export function renderPlan(p) {
  document.getElementById('techStack').innerHTML =
    p.techStack.map((t) => `<span class="tech-tag">${_esc(t)}</span>`).join('');

  document.getElementById('featureList').innerHTML =
    p.features.map((f) => `<li>${_esc(f)}</li>`).join('');

  document.getElementById('projectOverview').textContent = p.overview;
}

// ─── Folder structure tab ──────────────────────────────────────
export function renderStructure(p) {
  const el = document.getElementById('folderStructure');
  if (!el) return;

  if (!p.structure) {
    el.innerHTML = '<span style="color:var(--text-3)">No folder structure generated.</span>';
    return;
  }

  // Colour-code tree lines
  el.innerHTML = p.structure
    .split('\n')
    .map((line) => {
      // Folder: line ends with / or contains no dot after the last /
      const name = line.replace(/[├└│─\s]/g, '').trim();
      const isFolder = name.endsWith('/') || (!name.includes('.') && name.length > 0);
      const isConnector = /^[│\s]*$/.test(line) || line.trim() === '';

      if (isConnector) {
        return `<span class="tree-connector">${_esc(line)}</span>`;
      }
      if (isFolder) {
        return `<span class="tree-folder">${_esc(line)}</span>`;
      }
      return `<span class="tree-file">${_esc(line)}</span>`;
    })
    .join('\n');
}

// ─── Code viewer tab ───────────────────────────────────────────
export function renderCode(p) {
  const fileList       = document.getElementById('fileList');
  const codeContent    = document.getElementById('codeContent');
  const codeFileHeader = document.getElementById('codeFileHeader');
  if (!fileList || !codeContent || !codeFileHeader) return;

  if (!p.files?.length) {
    fileList.innerHTML  = '<p style="padding:16px;color:var(--text-3);font-size:0.8rem;">No files generated.</p>';
    codeContent.textContent = '// No starter files were generated.';
    return;
  }

  fileList.innerHTML = p.files
    .map(
      (file, i) => `
      <div class="file-item ${i === 0 ? 'active' : ''}" data-index="${i}" title="${_esc(file.name)}">
        <span>${fileIcon(file.name)}</span>
        <span class="file-item-name">${_esc(file.name.split('/').pop())}</span>
      </div>`
    )
    .join('');

  function showFile(idx) {
    const file = p.files[idx];
    displayFile(file.name, file.content);
    fileList.querySelectorAll('.file-item').forEach((item, i) =>
      item.classList.toggle('active', i === idx)
    );
  }

  showFile(0);

  fileList.querySelectorAll('.file-item').forEach((item) =>
    item.addEventListener('click', () => showFile(Number(item.dataset.index)))
  );
}

// ─── Evolution tab ─────────────────────────────────────────────
export function renderEvolution(p) {
  const container = document.getElementById('evolutionContainer');
  if (!container) return;

  const palette = {
    Scalability: '#7c3aed',
    Security:    '#ef4444',
    Performance: '#f59e0b',
    Feature:     '#06b6d4',
  };

  container.innerHTML = (p.evolution ?? [])
    .map((e) => {
      const color = palette[e.category] ?? '#7c3aed';
      return `
        <div class="evolution-card" style="border-left-color:${color}">
          <div class="evolution-category" style="color:${color}">${_esc(e.category)}</div>
          <div class="evolution-title">${_esc(e.title)}</div>
          <div class="evolution-desc">${_esc(e.description)}</div>
        </div>`;
    })
    .join('');
}

// ─── History grid ──────────────────────────────────────────────
/**
 * Render the history grid.
 * @param {Array}    entries    - from storage.getProjects()
 * @param {Function} onSelect   - called with the full project when a card is clicked
 * @param {Function} onDelete   - called with entry.id when × is clicked
 */
export function renderHistoryGrid(entries, onSelect, onDelete) {
  const grid = document.getElementById('historyGrid');
  if (!grid) return;

  if (!entries.length) {
    grid.innerHTML = `
      <div class="history-empty">
        <span class="history-empty-icon">🧠</span>
        <p>No projects yet. Generate your first one above!</p>
      </div>`;
    return;
  }

  grid.innerHTML = entries
    .map(
      (entry) => `
      <div class="history-card" data-id="${entry.id}">
        <button class="history-delete" data-id="${entry.id}" title="Delete">×</button>
        <div class="history-card-name">${_esc(entry.name)}</div>
        <div class="history-card-date">${_esc(entry.date)}</div>
        <div class="history-card-tags">
          ${entry.techStack.map((t) => `<span class="tag">${_esc(t)}</span>`).join('')}
        </div>
      </div>`
    )
    .join('');

  grid.querySelectorAll('.history-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('history-delete')) return;
      const entry = entries.find((h) => h.id === Number(card.dataset.id));
      if (entry) onSelect(entry.project);
    });
  });

  grid.querySelectorAll('.history-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete(Number(btn.dataset.id));
    });
  });
}

// ─── Utility ──────────────────────────────────────────────────
const _esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
