---
name: tab-organize
description: Organize browser tabs with an Edge/Chrome extension that exports the current window as standard JSON, lets an AI generate grouping plans, and re-imports the resulting groups JSON. Use when Codex needs to help sort large tab sets, remove duplicate tabs, clean common noise tabs such as Bilibili home or new-tab pages, or maintain the extension's JSON-based tab workflow.
---

# Tab Organize

Use the bundled browser extension in `src/` as the primary workflow.

## Follow This Workflow

1. Load the `src/` folder as an unpacked Edge or Chrome extension.
2. Export the current window to `tab-organize-export-*.json`.
3. Let Codex or another AI read that export file and produce `tab-organize-groups-*.json`.
4. Import the groups JSON through the popup and apply tab groups.

Prefer standard JSON files over long clipboard dumps because large pasted tab lists can drift, lose formatting, or misalign tab indices.

## Popup Capabilities

- Export current-window tabs as a standard JSON file.
- Scan duplicate tabs by normalized URL and close extras while keeping the pinned, active, or leftmost tab.
- Scan optional cleanup targets and manually close Bilibili home tabs and new-tab pages.
- Import grouping JSON either by file picker or drag and drop.

## Files To Edit

- `src/popup.html`: popup structure and step layout.
- `src/popup.css`: popup styling, import drop zone, and status states.
- `src/popup.js`: export/import flow, duplicate detection, cleanup rules, and group application.
- `src/manifest.json`: extension metadata and permissions.

## Group JSON Contract

Use this structure for imports:

```json
{
  "type": "tab-organize.groups",
  "version": "1.0",
  "groups": [
    { "name": "Group Name", "color": "blue", "tabs": [1, 2, 3] }
  ]
}
```

Allowed colors: `grey`, `blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`.

Treat `tabs` as 1-based indices from the export file. Do not add or remove tabs between export and import unless you regenerate the export.
