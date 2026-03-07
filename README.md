English | [简体中文](README_CN.md)

# Tab Organize — AI-Powered Browser Tab Grouping Extension

An Edge/Chrome extension that uses AI (Claude, ChatGPT, etc.) to intelligently group your browser tabs.

## Features

- One-click export of all tabs in the current window
- AI-powered grouping analysis (works with any LLM: Claude, ChatGPT, DeepSeek, etc.)
- Import grouping JSON via paste, drag & drop, or file picker
- Auto-apply tab groups in the browser
- 9 group colors available
- Compatible with Edge and Chrome
- **AI coding assistant support**: includes `CLAUDE.md` and `AGENTS.md` for Claude Code, Codex, OpenCode, and OpenClaw

## How It Works

```
1. Click extension → "Export to Clipboard" → tab info + prompt copied
2. Paste to AI (Claude/ChatGPT/etc.) → AI returns grouping JSON
3. Back to extension → import JSON (paste/drag/file) → "Apply Groups" → tabs auto-grouped
```

## Installation

1. Open `edge://extensions/` or `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `src` folder

## Usage

### Step 1: Export

Click the extension icon, then click **Export to Clipboard**. All tab info (title + URL) from the current window is copied along with a classification prompt.

### Step 2: AI Analysis

Paste the clipboard content to any AI (Claude, ChatGPT, DeepSeek, etc.). The AI returns JSON like:

```json
{
  "groups": [
    { "name": "Group Name", "color": "blue", "tabs": [1, 2, 3] }
  ]
}
```

Tab numbers are 1-based indices from the export.

### Step 3: Import & Apply

Back in the extension popup, import the JSON via:

- **Paste** — directly into the text box
- **Drag & drop** — drop a `.json` file
- **File picker** — click the file button

Then click **Apply Groups** to auto-group your tabs.

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
└── output/             ← Example grouping JSON
    └── groups.json
```

## Permissions

| Permission | Purpose |
|------------|---------|
| `tabs` | Read tab titles and URLs, create tab groups |
| `tabGroups` | Set group names and colors |

## Notes

- Export/import targets the **current window** only; handle multiple windows separately
- Do not add/remove tabs between export and import (indices will shift)
- If JSON paste fails, try file import instead

## License

MIT
