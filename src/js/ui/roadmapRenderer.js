// ============================================================
//  roadmapRenderer.js — Interactive roadmap renderer
//  Phase 3: Core Features
// ============================================================

/**
 * Render the interactive roadmap into #roadmapContainer.
 * Each step is a collapsible card with description + libs.
 * @param {object} project
 */
export function renderRoadmap(project) {
  const container = document.getElementById('roadmapContainer');
  if (!container) return;

  if (!project.roadmap?.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-3);font-family:'Comic Sans MS',cursive;">
        No roadmap steps were generated.
      </div>`;
    return;
  }

  container.innerHTML = project.roadmap
    .map((step, i) => _stepHTML(step, i))
    .join('');

  // Animate steps in with stagger
  container.querySelectorAll('.roadmap-step').forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(12px)';
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }, i * 80);
  });

  // Expand / collapse on header click
  container.querySelectorAll('.roadmap-step-header').forEach((header) => {
    header.addEventListener('click', () => {
      const step    = header.parentElement;
      const isOpen  = step.classList.contains('expanded');

      // Close all others
      container.querySelectorAll('.roadmap-step.expanded').forEach((s) =>
        s.classList.remove('expanded')
      );

      if (!isOpen) step.classList.add('expanded');
    });
  });

  // Auto-open step 1
  container.querySelector('.roadmap-step')?.classList.add('expanded');
}

// ─── Private ──────────────────────────────────────────────────
function _stepHTML(step, i) {
  const libs = (step.libs ?? [])
    .map((l) => `<span class="lib-tag">${l}</span>`)
    .join('');

  return `
    <div class="roadmap-step" data-index="${i}">
      <div class="roadmap-step-header">
        <div class="step-number">${i + 1}</div>
        <div class="step-info">
          <div class="step-title">${_esc(step.title)}</div>
          <div class="step-subtitle">${_esc(step.subtitle)}</div>
        </div>
        <span class="step-chevron">▼</span>
      </div>
      <div class="roadmap-step-body">
        <p class="step-description">${_esc(step.description)}</p>
        ${libs ? `<div class="step-libs">${libs}</div>` : ''}
      </div>
    </div>`;
}

const _esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
