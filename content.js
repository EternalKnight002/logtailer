// content.js

// 1. Inject the in-page script into the page's context
// This allows it to access and override the `console` object.
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inpage.js');
(document.head || document.documentElement).appendChild(script);

script.onload = () => {
  // The script can be removed after it has run.
  script.remove();
};

// 2. Listen for messages from the in-page script
window.addEventListener('message', (event) => {
  // We only accept messages from our own script
  if (event.source === window && event.data.type && event.data.type === 'LOGTAILER_LOG') {
    // 3. Forward the log message to the background script (service worker)
    chrome.runtime.sendMessage(event.data);
  }
});
