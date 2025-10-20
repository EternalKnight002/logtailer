# 🧩 LogTailer — Live Console Log Aggregator for Chrome

> **LogTailer** is a lightweight Chrome Extension for developers that aggregates **console logs from all open tabs** into one unified dashboard — like a real-time “tail -f” for your browser logs.

---

## 🚀 Features

- 📡 **Real-Time Streaming** — Capture `console.log`, `info`, `warn`, and `error` messages live from every open tab.
- 🪶 **No Frameworks** — Built with **pure JavaScript, HTML, and CSS** (no React, no Vite, no build tools).
- 🧠 **Manifest V3** — Secure, modern Chrome extension architecture using service workers.
- 🪄 **Live Dashboard**  
  - Tabs list on the left  
  - Logs panel on the right  
  - Filter by log level & search text
- 🧰 **Developer Tools**
  - Clear logs (per tab or all)
  - Export all logs to JSON
- 🛠 **Works Everywhere**
  - Supports normal sites & localhost development servers
  - CSP-safe injection mechanism

---

## 🧱 Folder Structure

```

logtailer/
├── manifest.json
├── background.js
├── content.js
├── inpage.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
├── index.html
├── popup.js
└── styles.css

````

---

## ⚙️ Installation (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/EternalKnight002/logtailer.git
````

2. Open Chrome and go to:

   ```
   chrome://extensions/
   ```
3. Enable **Developer Mode** (toggle in the top right).
4. Click **Load Unpacked** and select the `logtailer/` folder.
5. The LogTailer icon should now appear in your toolbar — pin it for quick access!

---

## 🧪 How to Use

1. Keep multiple tabs open (e.g. localhost app, API docs, etc.).
2. Click the **LogTailer** icon to open the popup dashboard.
3. On the left, select a tab.
   On the right, you’ll see all logs streaming in live.
4. Filter by log level (`Log`, `Info`, `Warn`, `Error`) or search text.
5. Click:

   * **Clear tab** — remove logs from current tab.
   * **Clear all** — remove all logs.
   * **Export JSON** — download all logs as a `.json` file.

---

## 🧰 Tech Overview

| Component         | Purpose                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **background.js** | Service worker that stores logs, relays updates to the popup, and manages tabs.          |
| **content.js**    | Injects `inpage.js` into every page and forwards captured logs to the background script. |
| **inpage.js**     | Runs in the page context, overrides `console.*`, and posts log messages outward.         |
| **popup/**        | UI that displays logs and allows searching, filtering, clearing, and exporting.          |
| **manifest.json** | Defines permissions, scripts, and extension structure (Manifest V3).                     |

---

## 🧩 Permissions Used

* `"scripting"` — for injecting scripts into page contexts.
* `"tabs"` — to list and identify open tabs.
* `"activeTab"` — to communicate with active pages.
* `"storage"` — (optional future use) for persisting logs.
* `"host_permissions": ["<all_urls>"]` — to capture logs from all pages.

---

## 🧭 Test Checklist

✅ Log messages appear from any tab (including `localhost`).
✅ Filters and search work as expected.
✅ Export JSON downloads valid log file.
✅ Works across multiple open tabs.
✅ Handles reloads without crashing.

---

## 🛡 Security & Privacy

* LogTailer **never sends logs externally**.
* All data stays in memory within the browser session.
* Works entirely offline — ideal for local development.

---

## 🧠 Future Enhancements

* 💾 Persistent logging using `chrome.storage.local`
* 🌗 Dark / Light theme switcher
* 🧩 Open dashboard in a standalone tab
* 🕸 Stream logs to a local backend or WebSocket viewer
* 🧹 Auto-prune old logs (configurable buffer size)

---

## 💡 Credits

Built by **[EternalKnight002](https://github.com/EternalKnight002)**
Inspired by the need for a clean, no-build, developer-friendly log tailing extension.

---

## 📜 License

This project is licensed under the GNU General Public License v3.0 .

```
