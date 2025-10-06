document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let state = {
    logs: {},
    tabs: {},
    activeTabId: null,
    filters: {
      level: { log: true, info: true, warn: true, error: true, debug: true },
      search: ''
    }
  };

  // --- DOM ELEMENTS ---
  const tabListEl = document.getElementById('tab-list');
  const logDisplayEl = document.getElementById('log-display');
  const searchBox = document.getElementById('search-box');
  const levelFilters = document.querySelectorAll('.filter-level');
  const clearTabBtn = document.getElementById('clear-tab-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const exportBtn = document.getElementById('export-btn');

  // --- INITIALIZATION ---
  // Request initial data from the background script
  chrome.runtime.sendMessage({ from: 'popup', type: 'GET_INITIAL_DATA' }, (response) => {
    if (response) {
      state.logs = response.logs || {};
      state.tabs = response.tabs || {};
      render();
    }
  });

  // --- EVENT LISTENERS ---
  
  // Listen for live updates from the background script
  chrome.runtime.onMessage.addListener((request) => {
    if (request.from === 'background' && request.type === 'NEW_LOG') {
      const { tabId, logEntry, tabInfo } = request.payload;
      
      if (!state.logs[tabId]) state.logs[tabId] = [];
      state.logs[tabId].push(logEntry);
      
      if (!state.tabs[tabId]) state.tabs[tabId] = tabInfo;
      
      render();
    }
  });

  // Search input
  searchBox.addEventListener('input', (e) => {
    state.filters.search = e.target.value.toLowerCase();
    renderLogs();
  });

  // Level filter checkboxes
  levelFilters.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      state.filters.level[e.target.value] = e.target.checked;
      renderLogs();
    });
  });
  
  // Tab selection
  tabListEl.addEventListener('click', (e) => {
    const tabItem = e.target.closest('.tab-item');
    if (tabItem && tabItem.dataset.tabId) {
      state.activeTabId = parseInt(tabItem.dataset.tabId);
      render();
    }
  });

  // Action buttons
  clearTabBtn.addEventListener('click', () => {
    if (!state.activeTabId) return;
    chrome.runtime.sendMessage({ from: 'popup', type: 'CLEAR_TAB_LOGS', payload: { tabId: state.activeTabId } }, (response) => {
      if (response.success) {
        state.logs[response.tabId] = [];
        render();
      }
    });
  });
  
  clearAllBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ from: 'popup', type: 'CLEAR_ALL_LOGS' }, (response) => {
      if (response.success) {
        state.logs = {};
        state.tabs = {};
        state.activeTabId = null;
        render();
      }
    });
  });

  exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `logtailer_export_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  // --- RENDER FUNCTIONS ---

  /** Main render function to update the whole UI */
  function render() {
    renderTabs();
    renderLogs();
  }

  /** Render the list of tabs in the sidebar */
  function renderTabs() {
    tabListEl.innerHTML = '';
    const tabIdsWithLogs = Object.keys(state.logs).filter(id => state.logs[id] && state.logs[id].length > 0);
    
    if (tabIdsWithLogs.length === 0) {
      tabListEl.innerHTML = `<li class="tab-item placeholder">No active tabs with logs.</li>`;
      return;
    }
    
    // Auto-select the first tab if none is active
    if (!state.activeTabId && tabIdsWithLogs.length > 0) {
        state.activeTabId = parseInt(tabIdsWithLogs[0]);
    }

    tabIdsWithLogs.forEach(tabId => {
      const tab = state.tabs[tabId] || { title: `Tab ID: ${tabId}`, favIconUrl: '' };
      const li = document.createElement('li');
      li.className = 'tab-item';
      li.dataset.tabId = tabId;
      if (parseInt(tabId) === state.activeTabId) {
        li.classList.add('active');
      }
      li.innerHTML = `
        <img src="${tab.favIconUrl || 'icons/default_favicon.png'}" class="tab-icon" onerror="this.src='icons/default_favicon.png'">
        <span class="tab-title">${tab.title}</span>
      `;
      tabListEl.appendChild(li);
    });
  }

  /** Render logs for the currently active tab */
  function renderLogs() {
    logDisplayEl.innerHTML = '';
    clearTabBtn.disabled = !state.activeTabId;

    if (!state.activeTabId || !state.logs[state.activeTabId]) {
        logDisplayEl.innerHTML = `<div class="log-entry log-placeholder"><p>Select a tab to view its console logs.</p></div>`;
        return;
    }

    const logsForTab = state.logs[state.activeTabId];
    
    const filteredLogs = logsForTab.filter(log => {
      const levelMatch = state.filters.level[log.level];
      const searchMatch = state.filters.search ? 
        JSON.stringify(log.message).toLowerCase().includes(state.filters.search) : true;
      return levelMatch && searchMatch;
    });

    if (filteredLogs.length === 0) {
        logDisplayEl.innerHTML = `<div class="log-entry log-placeholder"><p>No logs match the current filters.</p></div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredLogs.forEach(log => {
      const logEl = document.createElement('div');
      logEl.className = `log-entry log-${log.level}`;
      
      const formattedMessage = log.message.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          if (arg.__isError__) return `Error: ${arg.message}\n${arg.stack}`;
          return JSON.stringify(arg, null, 2);
        }
        return arg;
      }).join(' ');

      logEl.innerHTML = `
        <span class="timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="level">${log.level}</span>
        <span class="message"><pre>${escapeHTML(formattedMessage)}</pre></span>
      `;
      fragment.appendChild(logEl);
    });
    logDisplayEl.appendChild(fragment);
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (match) => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    });
  }
});
