import { constructUrl, findActiveProject } from '../utils/url.js';

chrome.commands.onCommand.addListener(async (command) => {
  // Commands are "switch_env_1", "switch_env_2", "switch_env_3"
  const envIndexMap = {
    "switch_env_1": 0,
    "switch_env_2": 1,
    "switch_env_3": 2
  };

  const targetIndex = envIndexMap[command];
  if (targetIndex === undefined) return;

  const result = await chrome.storage.sync.get('portalsConfig');
  const state = result.portalsConfig;
  
  if (!state || !state.projects || state.projects.length === 0) return;

  // Get active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  
  const currentTab = tabs[0];
  if (!currentTab.url || currentTab.url.startsWith('chrome://')) return;

  try {
    let activeProject = null;
    const foundId = findActiveProject(state.projects, currentTab.url);

    if (foundId) {
      activeProject = state.projects.find(p => p.id === foundId);
    }

    // Fallback to active project if auto-detect fails
    if (!activeProject && state.activeProjectId) {
      activeProject = state.projects.find(p => p.id === state.activeProjectId);
    }

    // Fallback to first project
    if (!activeProject) {
      activeProject = state.projects[0];
    }

    // Get the target environment
    if (!activeProject.envs[targetIndex]) return; // Env doesn't exist at this index
    
    const targetEnv = activeProject.envs[targetIndex];
    const newUrl = constructUrl(currentTab.url, targetEnv.domain);
    
    if (!newUrl) return;

    if (state.openInNewTab) {
      chrome.tabs.create({ url: newUrl });
    } else {
      chrome.tabs.update(currentTab.id, { url: newUrl });
    }

  } catch (err) {
    console.error("Error parsing URL or switching environment:", err);
  }
});
