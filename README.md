English | [简体中文](README_CN.md)

# Tab Organize — AI-Powered Browser Tab Grouping Extension

An Edge/Chrome extension that uses AI (Claude, ChatGPT, etc.) to intelligently group your browser tabs.

## Features

- One-click export of current-window tabs as a standard JSON file
- Scan duplicate tabs in the current window and close them in one click
- Optional cleanup for common tabs: Bilibili home page and new tab pages
- AI-powered grouping analysis (works with any LLM: Claude, ChatGPT, DeepSeek, etc.)
- Import grouping plans from standard JSON files
- Auto-apply tab groups in the browser
- 9 group colors available
- Compatible with Edge and Chrome
- **AI coding assistant support**: includes `CLAUDE.md` and `AGENTS.md` for Claude Code, Codex, OpenCode, and OpenClaw

## How It Works

```
1. Click the extension and optionally clean duplicate tabs in the current window
2. Optionally clean common tabs such as the Bilibili home page and new tab pages
3. Click "Export JSON File" → save `tab-organize-export-*.json` to your Desktop
4. Ask AI (Codex/Claude/ChatGPT/etc.) to read that file and generate `tab-organize-groups-*.json`
5. Save the generated groups JSON to your Desktop
6. Return to the extension → choose the groups JSON file, or drag it into the popup → "Apply Groups" → tabs auto-grouped
```

## Installation

1. Open `edge://extensions/` or `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `src` folder

## Usage

### Quick Dedupe

Open the popup and it will automatically scan the current window for duplicate tabs. The popup shows:

- duplicate tab groups
- duplicate tabs that can be closed

Click **Close Duplicate Tabs** to dedupe by normalized URL. The extension keeps the pinned tab first, then the active tab, then the leftmost tab. Common tracking params such as `utm_*`, `spm`, and `from` are ignored during matching.

### Common Tab Cleanup

The popup also scans optional cleanup targets and lets you close them manually. It currently includes:

- Bilibili home page tabs such as `https://www.bilibili.com/`
- new tab pages

It explicitly does not include:

- Bilibili search pages under `https://search.bilibili.com/...`

### Step 1: Export

Click the extension icon, then click **Export JSON File**. The current window is exported as a standard JSON file.

Recommended filename pattern:

- `tab-organize-export-YYYYMMDD-HHMMSS.json`

Saving to the Desktop is recommended so AI and the extension can share the same file workflow.

### Step 2: AI Analysis

Give the exported JSON file to any AI (Claude, ChatGPT, Codex, DeepSeek, etc.). The AI should generate a standard groups JSON file like:

```json
{
  "type": "tab-organize.groups",
  "version": "1.0",
  "groups": [
    { "name": "Group Name", "color": "blue", "tabs": [1, 2, 3] }
  ]
}
```

Tab numbers are 1-based indices from the export JSON.

Recommended filename pattern:

- `tab-organize-groups-YYYYMMDD-HHMMSS.json`

### Step 3: Import & Apply

Back in the extension popup, import the generated groups JSON in either way:

- click **Choose Groups JSON**
- drag the `.json` file from your Desktop into the popup drop zone

Then click **Apply Groups**.

## Available Group Colors

`grey` `blue` `red` `yellow` `green` `pink` `purple` `cyan` `orange`

## File Structure

```
├── README.md
├── README_CN.md
├── CLAUDE.md / AGENTS.md
├── src/                ← Load this folder as extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── background.js
│   └── icons/
└── output/             ← Example JSON files
    ├── export.example.json
    └── groups.json
```

## Permissions

| Permission | Purpose |
|------------|---------|
| `tabs` | Read tab titles and URLs, create tab groups |
| `tabGroups` | Set group names and colors |
| `downloads` | Fallback save dialog for JSON export when File System Access API is unavailable |

## Notes

- Export/import targets the **current window** only; handle multiple windows separately
- Duplicate-tab cleanup also targets the **current window** only
- Common-tab cleanup also targets the **current window** only
- Do not add/remove tabs between export and import (indices will shift)
- For normal Edge sessions, prefer the Desktop JSON export/import workflow instead of clipboard-based long text

## License

MIT
