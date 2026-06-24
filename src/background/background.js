import { constructUrl, findActiveProject } from '../utils/url.js';
import { openSideBySide } from '../utils/window.js';

chrome.commands.onCommand.addListener(async (command) => {
  // Commands are "switch_env_1/2/3" and "split_env_1/2/3"
  const envIndexMap = {
    "switch_env_1": { index: 0, split: false },
    "switch_env_2": { index: 1, split: false },
    "switch_env_3": { index: 2, split: false },
    "split_env_1": { index: 0, split: true },
    "split_env_2": { index: 1, split: true },
    "split_env_3": { index: 2, split: true }
  };

  const commandConfig = envIndexMap[command];
  if (!commandConfig) return;
  const targetIndex = commandConfig.index;
  const isSplit = commandConfig.split;

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

    if (isSplit) {
      await openSideBySide(currentTab.windowId, newUrl);
    } else if (state.openInNewTab || state.openSideBySide) {
      // Fallback for older configs: openInNewTab if state wasn't migrated
      // If the popup says openSideBySide, a normal switch also does a split?
      // Wait, let's keep the split logic triggered here only via shortcut,
      // and if the user wants popup switch to trigger split, they'll use openSideBySide.
      // We will handle the popup click split in popup.js, but just to be safe:
      chrome.tabs.create({ url: newUrl });
    } else {
      chrome.tabs.update(currentTab.id, { url: newUrl });
    }

  } catch (err) {
    console.error("Error parsing URL or switching environment:", err);
  }
});
