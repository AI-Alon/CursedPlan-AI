// ============================================================
//  BrainSpark — app.js
//  Phase 3: Core Features
//
//  Orchestrates all modules. Handles tabs, loading, and
//  top-level app flow.
// ============================================================

// Auth
import { onAuthChange, signInWithGoogle, signOutUser,
         getCurrentUser, checkDailyLimit, recordUsage,
         isFirebaseReady, DAILY_LIMIT } from './auth/auth.js';

// AI modules (Phase 2)
import { callLLM } from './ai/aiClient.js';
import { buildProjectPrompt, buildRefinePrompt } from './ai/promptBuilder.js';
import { parseProjectResponse }           from './ai/responseParser.js';

// AI modules (Phase 4)
import { evolveProject }  from './ai/evolutionEngine.js';
import { generateCode }   from './ai/codeGenerator.js';

// UI modules (Phase 3)
import { initMermaid, renderDiagram } from './ui/diagramRenderer.js';
import { renderRoadmap }              from './ui/roadmapRenderer.js';
import { renderHeader, renderPlan, renderStructure,
         renderCode, renderEvolution,
         renderHistoryGrid }          from './ui/renderEngine.js';

// UI modules (Phase 4)
import { exportToZip, downloadProjectPlan } from './ui/githubExporter.js';

// Utils (Phase 3)
import { saveProject, getProjects,
         deleteProject, clearProjects } from './utils/storage.js';
import { sleep, showToast, copyToClipboard } from './utils/helpers.js';

// ─── State ────────────────────────────────────────────────────
let currentProject = null;

// ─── DOM refs ─────────────────────────────────────────────────
const ideaInput      = document.getElementById('ideaInput');
const generateBtn    = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const outputSection  = document.getElementById('outputSection');
const loadingBar     = document.getElementById('loadingBar');

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMermaid();
  initTabs();
  bindEvents();
  renderHistory();
  initAuth();
});

// ─── Auth ──────────────────────────────────────────────────────
function initAuth() {
  const signInBtn  = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');

  signInBtn?.addEventListener('click', () => signInWithGoogle().catch(err => showToast(`Sign-in failed: ${err.message}`, 'error')));
  signOutBtn?.addEventListener('click', () => signOutUser());

  onAuthChange(updateAuthUI);
}

function updateAuthUI(user) {
  const signInBtn  = document.getElementById('signInBtn');
  const userChip   = document.getElementById('userChip');
  const userAvatar = document.getElementById('userAvatar');
  const userName   = document.getElementById('userName');
  const dailyBadge = document.getElementById('dailyBadge');
  const authNotice = document.getElementById('authNotice');

  if (!isFirebaseReady()) {
    // Firebase not configured — hide auth elements entirely
    if (signInBtn) signInBtn.style.display = 'none';
    return;
  }

  if (user) {
    signInBtn.style.display  = 'none';
    userChip.style.display   = 'flex';
    userAvatar.src           = user.photoURL || '';
    userName.textContent     = user.displayName?.split(' ')[0] || user.email;

    // Update badge asynchronously
    checkDailyLimit().then(({ allowed }) => {
      const remaining = allowed ? DAILY_LIMIT : 0;
      dailyBadge.textContent = remaining > 0 ? `${remaining} plan left today` : 'Limit reached';
      dailyBadge.classList.toggle('used', !allowed);
    });

    if (authNotice) authNotice.style.display = 'none';
  } else {
    signInBtn.style.display = 'inline-flex';
    userChip.style.display  = 'none';
    if (authNotice) {
      authNotice.className     = 'auth-notice warn';
      authNotice.textContent   = 'Sign in with Google to generate your free plan of the day.';
      authNotice.style.display = 'block';
    }
  }
}

// ─── Event bindings ────────────────────────────────────────────
function bindEvents() {
  generateBtn.addEventListener('click', handleGenerate);

  ideaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
  });

  document.getElementById('newProjectBtn')
    ?.addEventListener('click', resetToInput);

  document.getElementById('planMdBtn')
    ?.addEventListener('click', () => {
      if (!currentProject) return showToast('Generate a project first!', 'error');
      downloadProjectPlan(currentProject);
      showToast('✓ project-plan.md downloaded!', 'success');
    });

  document.getElementById('refineBtn')
    ?.addEventListener('click', openRefineModal);
  document.getElementById('refineModalClose')
    ?.addEventListener('click', closeRefineModal);
  document.getElementById('refineCancelBtn')
    ?.addEventListener('click', closeRefineModal);
  document.getElementById('refineSubmitBtn')
    ?.addEventListener('click', handleRefine);
  document.getElementById('refineModal')
    ?.addEventListener('click', (e) => {
      if (e.target.id === 'refineModal') closeRefineModal();
    });

  document.getElementById('evolveBtn')
    ?.addEventListener('click', handleEvolve);

  document.getElementById('reevolveBtn')
    ?.addEventListener('click', handleEvolve);

  document.getElementById('exportBtn')
    ?.addEventListener('click', handleExport);

  document.getElementById('regenCodeBtn')
    ?.addEventListener('click', handleRegenCode);

  document.getElementById('clearHistoryBtn')
    ?.addEventListener('click', handleClearHistory);


  document.getElementById('copyDiagramBtn')
    ?.addEventListener('click', () => {
      if (currentProject) copyToClipboard(currentProject.diagram, 'Mermaid code copied!');
    });

  document.getElementById('copyStructureBtn')
    ?.addEventListener('click', () => {
      if (currentProject) copyToClipboard(currentProject.structure, 'Folder structure copied!');
    });
}

// ─── Tab system ────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab').forEach((tab) =>
    tab.addEventListener('click', () => switchTab(tab.dataset.tab))
  );
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
    t.setAttribute('aria-selected', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach((p) =>
    p.classList.toggle('active', p.id === `panel-${name}`)
  );
}

// ─── Generate ──────────────────────────────────────────────────
async function handleGenerate() {
  const idea = ideaInput.value.trim();
  if (!idea) {
    ideaInput.classList.add('shake');
    ideaInput.focus();
    setTimeout(() => ideaInput.classList.remove('shake'), 450);
    return;
  }

  // Auth + daily limit gate (only when Firebase is configured)
  if (isFirebaseReady()) {
    const { allowed, reason } = await checkDailyLimit();
    if (!allowed) {
      const authNotice = document.getElementById('authNotice');
      if (reason === 'not_logged_in') {
        showToast('Sign in with Google to generate a plan!', 'error');
        if (authNotice) {
          authNotice.className     = 'auth-notice warn';
          authNotice.textContent   = 'Sign in with Google to generate your free plan of the day.';
          authNotice.style.display = 'block';
        }
      } else {
        showToast('You\'ve used your free plan for today. Come back tomorrow!', 'error');
        if (authNotice) {
          authNotice.className     = 'auth-notice error';
          authNotice.textContent   = 'Daily limit reached. You get 1 free plan per day — come back tomorrow!';
          authNotice.style.display = 'block';
        }
      }
      return;
    }
  }

  showLoading();

  try {
    currentProject = await generateProject(idea);
    await recordUsage();
    hideLoading();
    renderProject(currentProject);
    saveProject(currentProject);
    renderHistory();
    updateAuthUI(getCurrentUser()); // refresh daily badge
  } catch (err) {
    hideLoading();
    showToast(`⚠️ ${err.message}`, 'error');
    console.error('BrainSpark error:', err);
  }
}

// ─── Real AI generation ────────────────────────────────────────
async function generateProject(idea) {
  stepActive(1); setBar(15);
  await sleep(400);

  stepDone(1); stepActive(2); setBar(35);
  const prompt = buildProjectPrompt(idea);
  const raw    = await callLLM(prompt);

  stepDone(2); stepActive(3); setBar(70);
  await sleep(300);
  const project = parseProjectResponse(raw);

  stepDone(3); stepActive(4); setBar(100);
  await sleep(400);
  stepDone(4);

  return project;
}

// ─── Loading helpers ───────────────────────────────────────────
function showLoading() {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step${i}`);
    el?.classList.remove('active', 'done');
  }
  loadingBar.style.width = '0%';
  loadingOverlay.classList.remove('hidden');
  generateBtn.disabled = true;
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
  generateBtn.disabled = false;
}

function stepActive(n) {
  const el = document.getElementById(`step${n}`);
  el?.classList.remove('done');
  el?.classList.add('active');
}
function stepDone(n) {
  const el = document.getElementById(`step${n}`);
  el?.classList.remove('active');
  el?.classList.add('done');
}
function setBar(pct) { loadingBar.style.width = `${pct}%`; }

// ─── Render project ────────────────────────────────────────────
function renderProject(project) {
  outputSection.classList.remove('hidden');
  outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  renderHeader(project);
  renderPlan(project);
  renderDiagram(project); // async — renders in background, no need to await
  renderRoadmap(project);
  renderStructure(project);
  renderCode(project);
  renderEvolution(project);

  switchTab('plan');
}

// ─── Refine handlers ───────────────────────────────────────────
function openRefineModal() {
  if (!currentProject) return showToast('Generate a project first!', 'error');
  document.getElementById('refineFeedback').value = '';
  document.getElementById('refineModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('refineFeedback').focus(), 50);
}

function closeRefineModal() {
  document.getElementById('refineModal').classList.add('hidden');
}

async function handleRefine() {
  const feedback = document.getElementById('refineFeedback').value.trim();
  if (!feedback) {
    showToast('Please describe what to change', 'error');
    return;
  }

  closeRefineModal();
  showLoading();
  document.getElementById('loadingTitle') &&
    (document.querySelector('.loading-title').textContent = 'Refining your project...');

  try {
    stepActive(1); setBar(20);
    await sleep(300);
    stepDone(1); stepActive(2); setBar(45);
    const raw = await callLLM(buildRefinePrompt(currentProject, feedback));
    stepDone(2); stepActive(3); setBar(75);
    await sleep(200);
    currentProject = parseProjectResponse(raw);
    stepDone(3); stepActive(4); setBar(100);
    await sleep(300);
    stepDone(4);

    hideLoading();
    renderProject(currentProject);
    saveProject(currentProject);
    renderHistory();
    showToast('✓ Project refined!', 'success');
  } catch (err) {
    hideLoading();
    showToast(`⚠️ ${err.message}`, 'error');
  }
}

// ─── Phase 4 handlers ──────────────────────────────────────────

async function handleEvolve() {
  if (!currentProject) return showToast('Generate a project first!', 'error');

  const btn = document.getElementById('evolveBtn');
  const btn2 = document.getElementById('reevolveBtn');
  const setBusy = (v) => { if (btn) btn.disabled = v; if (btn2) btn2.disabled = v; };

  setBusy(true);
  showToast('🔮 Evolving project with AI...');

  try {
    const suggestions = await evolveProject(currentProject);
    currentProject = { ...currentProject, evolution: suggestions };
    renderEvolution(currentProject);
    switchTab('evolution');
    showToast('✓ Evolution complete!', 'success');
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 'error');
  } finally {
    setBusy(false);
  }
}

async function handleRegenCode() {
  if (!currentProject) return showToast('Generate a project first!', 'error');

  const btn = document.getElementById('regenCodeBtn');
  if (btn) btn.disabled = true;
  showToast('⚡ Generating detailed code files...');

  try {
    const files = await generateCode(currentProject);
    if (!files.length) throw new Error('No files were returned. Please try again.');
    currentProject = { ...currentProject, files };
    renderCode(currentProject);
    showToast(`✓ ${files.length} files generated!`, 'success');
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function handleExport() {
  if (!currentProject) return showToast('Generate a project first!', 'error');

  const btn = document.getElementById('exportBtn');
  if (btn) btn.disabled = true;
  showToast('📦 Building ZIP...');

  try {
    await exportToZip(currentProject);
    showToast('✓ ZIP downloaded!', 'success');
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ─── History ───────────────────────────────────────────────────
function renderHistory() {
  renderHistoryGrid(
    getProjects(),
    (project) => {
      currentProject = project;
      renderProject(currentProject);
    },
    (id) => {
      deleteProject(id);
      renderHistory();
    }
  );
}

function handleClearHistory() {
  if (!confirm('Clear all project history?')) return;
  clearProjects();
  renderHistory();
  showToast('History cleared', 'success');
}

// ─── Reset ─────────────────────────────────────────────────────
function resetToInput() {
  outputSection.classList.add('hidden');
  ideaInput.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  ideaInput.focus();
}
