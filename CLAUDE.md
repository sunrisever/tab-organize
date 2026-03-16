> This file is for AI coding assistants (Claude Code, Codex, OpenCode, OpenClaw, etc.). It is optional and can be safely deleted.

# tab-organize

Browser extension for AI-powered tab grouping. Export a standard JSON file from the current window, let an AI generate a groups JSON file, then import and apply it.

## Architecture

- `src/manifest.json`: Chrome extension manifest v3
- `src/popup.html/js/css`: Extension popup UI (export, import, apply)
- `src/background.js`: Service worker — handles tab grouping via chrome.tabs API
- `output/`: Example export/groups JSON files

## Key Workflow

1. User clicks "Export JSON File" and saves `tab-organize-export-*.json` to Desktop
2. AI reads that export file and generates `tab-organize-groups-*.json`
3. User chooses the groups JSON file in the extension, or drags it into the popup, and applies groups

## Group JSON Format

```json
{
  "type": "tab-organize.groups",
  "version": "1.0",
  "groups": [{"name": "Group Name", "color": "blue", "tabs": [1, 2, 3]}]
}
```

Colors: grey, blue, red, yellow, green, pink, purple, cyan, orange
Tab numbers are 1-based indices from the export.

## Important Notes

- Extension requires `tabs`, `tabGroups`, and `downloads` permissions
- Works per-window (export/import targets current window)
- Do not add/remove tabs between export and import (indices will shift)
- Compatible with both Edge and Chrome
- For the user's normal Edge sessions, prefer Desktop JSON export/import over clipboard text to avoid formatting drift in long tab lists
