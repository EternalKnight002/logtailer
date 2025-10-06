// background.js - Service Worker

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ logs: {}, tabs: {} });
  console.log("LogTailer installed and storage initialized.");
});

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle new log entry from content script
  if (request.type === 'LOGTAILER_LOG') {
    const { tab } = sender;
    if (tab && tab.id) {
      handleNewLog(request.payload, tab);
    }
    return true; // Indicates we will send a response asynchronously
  }

  // Handle requests from the popup
  if (request.from === 'popup') {
    handlePopupRequest(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  }
});

// Clean up logs for closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get(['logs', 'tabs'], (result) => {
    delete result.logs[tabId];
    delete result.tabs[tabId];
    chrome.storage.local.set({ logs: result.logs, tabs: result.tabs });
  });
});

/**
 * Stores a new log entry and updates tab information.
 * @param {object} logEntry - The log data from inpage.js.
 * @param {object} tab - The tab object from the message sender.
 */
async function handleNewLog(logEntry, tab) {
  const { logs, tabs } = await chrome.storage.local.get(['logs', 'tabs']);
  
  // Initialize log array for the tab if it doesn't exist
  if (!logs[tab.id]) {
    logs[tab.id] = [];
  }
  
  // Add new log
  logs[tab.id].push(logEntry);

  // Update tab info (title, favicon)
  tabs[tab.id] = {
    id: tab.id,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
  };

  // Save back to storage
  await chrome.storage.local.set({ logs, tabs });

  // Notify the popup if it's open
  chrome.runtime.sendMessage({
    from: 'background',
    type: 'NEW_LOG',
    payload: { tabId: tab.id, logEntry, tabInfo: tabs[tab.id] }
  }).catch(error => {
    // Suppress "Receiving end does not exist" error when popup is closed.
    if (error.message.includes('Receiving end does not exist')) return;
    console.error('Error sending message to popup:', error);
  });
}

/**
 * Handles various data requests from the popup UI.
 * @param {object} request - The message from the popup.
 * @param {function} sendResponse - The callback to send data back.
 */
async function handlePopupRequest(request, sendResponse) {
  const { type, payload } = request;
  const { logs, tabs } = await chrome.storage.local.get(['logs', 'tabs']);

  switch (type) {
    case 'GET_INITIAL_DATA':
      sendResponse({ logs, tabs });
      break;

    case 'CLEAR_TAB_LOGS':
      if (logs[payload.tabId]) {
        logs[payload.tabId] = [];
        await chrome.storage.local.set({ logs });
        sendResponse({ success: true, tabId: payload.tabId });
      }
      break;

    case 'CLEAR_ALL_LOGS':
      await chrome.storage.local.set({ logs: {}, tabs: {} });
      sendResponse({ success: true });
      break;
    
    default:
      sendResponse({ success: false, error: 'Unknown request type' });
      break;
  }
}
