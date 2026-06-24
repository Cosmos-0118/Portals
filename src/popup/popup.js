/* ═══════════════════════════════════════════════
   Portals – popup.js
   ═══════════════════════════════════════════════ */

import { constructUrl, findActiveProject, getCleanDomain } from '../utils/url.js';
import { openSideBySide } from '../utils/window.js';

const DEFAULT_CONFIG = {
  projects: [
    {
      id: 'proj_default',
      name: 'My App',
      envs: [
        { name: 'Local',      domain: 'localhost:3000' },
        { name: 'Staging',    domain: 'staging.myapp.com' },
        { name: 'Production', domain: 'myapp.com' }
      ]
    }
  ],
  openSideBySide: false,
  activeProjectId: 'proj_default'
};

let state = null;
let currentTabUrl = null;

/* ────────────────────────────────────────────
   Bootstrap
   ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const stored = await chrome.storage.sync.get('portalsConfig');
  state = stored.portalsConfig || structuredClone(DEFAULT_CONFIG);

  if (!state.activeProjectId && state.projects.length) {
    state.activeProjectId = state.projects[0].id;
  }

  // Read current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try { currentTabUrl = new URL(tab.url); } catch (_) {}
  }

  autoDetectProject();
  renderMainView();
  bindGlobalListeners();
}

/* ────────────────────────────────────────────
   Persistence
   ──────────────────────────────────────────── */
function save() {
  chrome.storage.sync.set({ portalsConfig: state });
}

/* ────────────────────────────────────────────
   Auto-detect project from current URL
   ──────────────────────────────────────────── */
function autoDetectProject() {
  if (!currentTabUrl) return;
  const foundId = findActiveProject(state.projects, currentTabUrl.href);
  if (foundId) {
    state.activeProjectId = foundId;
  }
}

/* ════════════════════════════════════════════
   MAIN VIEW
   ════════════════════════════════════════════ */
function renderMainView() {
  // Toggle
  const toggleEl = document.getElementById('toggle-sidebyside');
  toggleEl.classList.toggle('active', state.openSideBySide || state.openInNewTab);

  // Profile dropdown
  renderProfileDropdown();

  // Environment list
  renderEnvList();
}

/* ─── Custom Dropdown ───────────────────── */
function renderProfileDropdown() {
  const valueEl = document.getElementById('profile-value');
  const optionsEl = document.getElementById('profile-options');

  const active = state.projects.find(p => p.id === state.activeProjectId);
  valueEl.textContent = active ? active.name : 'No profiles';

  optionsEl.innerHTML = '';
  state.projects.forEach(proj => {
    const opt = document.createElement('div');
    opt.className = 'custom-select-option' + (proj.id === state.activeProjectId ? ' selected' : '');
    opt.textContent = proj.name;
    opt.addEventListener('click', () => {
      state.activeProjectId = proj.id;
      save();
      closeDropdown();
      renderMainView();
    });
    optionsEl.appendChild(opt);
  });
}

function toggleDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('open');
}
function closeDropdown() {
  document.getElementById('profile-dropdown').classList.remove('open');
}

/* ─── Env List ──────────────────────────── */
function renderEnvList() {
  const container = document.getElementById('env-list');
  container.innerHTML = '';

  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj || !proj.envs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <div>No environments yet.<br>Open <strong>Settings</strong> to add domains.</div>
      </div>`;
    return;
  }

  proj.envs.forEach((env, i) => {
    const isCurrent = isCurrentEnv(env.domain);
    const card = document.createElement('div');
    card.className = 'env-card' + (isCurrent ? ' current' : '');

    const shortcutLabel = i < 3 ? `⌃⇧${i + 1}` : '';

    card.innerHTML = `
      <span class="env-dot"></span>
      <div class="env-info">
        <div class="env-info-name">${esc(env.name)}</div>
        <div class="env-info-domain">${esc(env.domain)}</div>
      </div>
      ${shortcutLabel ? `<span class="env-kbd">${shortcutLabel}</span>` : ''}
    `;

    card.addEventListener('click', () => switchEnv(env.domain));
    container.appendChild(card);
  });
}

/* ════════════════════════════════════════════
   SETTINGS VIEW
   ════════════════════════════════════════════ */
function renderSettingsView() {
  const container = document.getElementById('profiles-editor');
  container.innerHTML = '';

  if (!state.projects.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div>No profiles yet.<br>Click <strong>New Profile</strong> to get started.</div>
      </div>`;
    return;
  }

  state.projects.forEach((proj, pIdx) => {
    const card = document.createElement('div');
    card.className = 'p-card';

    // Header
    const header = document.createElement('div');
    header.className = 'p-card-header';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'p-card-name';
    nameInput.value = proj.name;
    nameInput.placeholder = 'Profile name';
    nameInput.addEventListener('input', () => {
      proj.name = nameInput.value;
      save();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'p-card-delete';
    delBtn.title = 'Delete profile';
    delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    delBtn.addEventListener('click', () => {
      state.projects.splice(pIdx, 1);
      if (state.activeProjectId === proj.id && state.projects.length) {
        state.activeProjectId = state.projects[0].id;
      }
      save();
      renderSettingsView();
    });

    header.appendChild(nameInput);
    header.appendChild(delBtn);
    card.appendChild(header);

    // Body (env rows)
    const body = document.createElement('div');
    body.className = 'p-card-body';

    proj.envs.forEach((env, eIdx) => {
      body.appendChild(createEnvRow(proj, env, eIdx, body));
    });

    // Add env button
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-env';
    addBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add environment`;
    addBtn.addEventListener('click', () => {
      proj.envs.push({ name: '', domain: '' });
      save();
      renderSettingsView();
      // Focus the newly created name input
      requestAnimationFrame(() => {
        const rows = container.querySelectorAll('.p-card');
        const lastCard = rows[pIdx];
        if (lastCard) {
          const inputs = lastCard.querySelectorAll('.name-input');
          const last = inputs[inputs.length - 1];
          if (last) last.focus();
        }
      });
    });

    body.appendChild(addBtn);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function createEnvRow(proj, env, eIdx, bodyEl) {
  const row = document.createElement('div');
  row.className = 'env-row';

  const nameIn = document.createElement('input');
  nameIn.type = 'text';
  nameIn.className = 'env-row-input name-input';
  nameIn.value = env.name;
  nameIn.placeholder = 'Name';
  nameIn.addEventListener('input', () => { env.name = nameIn.value; save(); });

  const domainIn = document.createElement('input');
  domainIn.type = 'text';
  domainIn.className = 'env-row-input domain-input';
  domainIn.value = env.domain;
  domainIn.placeholder = 'e.g. localhost:3000';
  domainIn.addEventListener('input', () => { env.domain = domainIn.value; save(); });

  // Tab from name → domain
  nameIn.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      domainIn.focus();
    }
  });

  // Enter on domain → add new row
  domainIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      proj.envs.push({ name: '', domain: '' });
      save();
      renderSettingsView();
      requestAnimationFrame(() => {
        const allNameInputs = bodyEl.closest('.p-card').querySelectorAll('.name-input');
        const last = allNameInputs[allNameInputs.length - 1];
        if (last) last.focus();
      });
    }
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'env-row-delete';
  delBtn.title = 'Remove';
  delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  delBtn.addEventListener('click', () => {
    proj.envs.splice(eIdx, 1);
    save();
    renderSettingsView();
  });

  row.appendChild(nameIn);
  row.appendChild(domainIn);
  row.appendChild(delBtn);
  return row;
}

/* ════════════════════════════════════════════
   Switching logic
   ════════════════════════════════════════════ */
async function switchEnv(targetDomain) {
  if (!currentTabUrl) return;

  const newUrl = constructUrl(currentTabUrl.href, targetDomain);
  if (!newUrl) return;

  if (state.openSideBySide || state.openInNewTab) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      await openSideBySide(tabs[0].windowId, newUrl);
    }
  } else {
    chrome.tabs.update({ url: newUrl });
  }
}

/* ════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════ */
function isCurrentEnv(domain) {
  if (!currentTabUrl) return false;
  const clean = getCleanDomain(domain);
  return currentTabUrl.host === clean;
}

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

/* ════════════════════════════════════════════
   Global Listeners
   ════════════════════════════════════════════ */
function bindGlobalListeners() {
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');

  // Settings button
  document.getElementById('btn-settings').addEventListener('click', () => {
    mainView.classList.remove('active');
    settingsView.classList.add('active');
    renderSettingsView();
  });

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    settingsView.classList.remove('active');
    mainView.classList.add('active');
    renderMainView();
  });

  // Add profile
  document.getElementById('btn-add-profile').addEventListener('click', () => {
    const newProj = {
      id: 'proj_' + Date.now(),
      name: '',
      envs: [{ name: '', domain: '' }]
    };
    state.projects.push(newProj);
    save();
    renderSettingsView();
    // Focus the new profile name
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll('.p-card-name');
      const last = cards[cards.length - 1];
      if (last) last.focus();
    });
  });

  // Custom dropdown trigger
  document.getElementById('profile-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#profile-dropdown')) closeDropdown();
  });

  // Toggle side-by-side switch
  document.getElementById('toggle-sidebyside').addEventListener('click', () => {
    state.openSideBySide = !(state.openSideBySide || state.openInNewTab);
    state.openInNewTab = false; // migrate old state
    save();
    renderMainView();
  });

  // Keyboard shortcuts within popup
  document.addEventListener('keydown', (e) => {
    // "S" opens settings
    if (e.key === 's' && !isInputFocused()) {
      e.preventDefault();
      mainView.classList.remove('active');
      settingsView.classList.add('active');
      renderSettingsView();
    }
    // "Escape" goes back to main
    if (e.key === 'Escape') {
      if (settingsView.classList.contains('active')) {
        settingsView.classList.remove('active');
        mainView.classList.add('active');
        renderMainView();
      }
      closeDropdown();
    }
    // "N" adds new profile (in settings)
    if (e.key === 'n' && !isInputFocused() && settingsView.classList.contains('active')) {
      e.preventDefault();
      document.getElementById('btn-add-profile').click();
    }
    // 1-9 quick switch (in main view, not in input)
    if (!isInputFocused() && mainView.classList.contains('active') && /^[1-9]$/.test(e.key)) {
      const proj = state.projects.find(p => p.id === state.activeProjectId);
      const idx = parseInt(e.key) - 1;
      if (proj && proj.envs[idx]) {
        switchEnv(proj.envs[idx].domain);
      }
    }
  });
}

function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
