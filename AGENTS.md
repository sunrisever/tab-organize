> This file is for AI coding assistants (Claude Code, Codex, OpenCode, OpenClaw, etc.). It is optional and can be safely deleted.

# tab-organize

Browser extension for AI-powered tab grouping. Export tab info → AI classifies → import JSON to auto-group tabs.

## Architecture

- `src/manifest.json`: Chrome extension manifest v3
- `src/popup.html/js/css`: Extension popup UI (export, import, apply)
- `src/background.js`: Service worker — handles tab grouping via chrome.tabs API
- `output/`: Example grouping JSON

## Key Workflow

1. User clicks "Export" → copies tab info + prompt to clipboard
2. User pastes to any AI (Claude, ChatGPT, etc.) → gets grouping JSON
3. User imports JSON → extension applies tab groups via chrome.tabs.group()

## Group JSON Format

```json
{"groups": [{"name": "Group Name", "color": "blue", "tabs": [1, 2, 3]}]}
```

Colors: grey, blue, red, yellow, green, pink, purple, cyan, orange
Tab numbers are 1-based indices from the export.

## Important Notes

- Extension requires `tabs` and `tabGroups` permissions
- Works per-window (export/import targets current window)
- Do not add/remove tabs between export and import (indices will shift)
- Compatible with both Edge and Chrome
