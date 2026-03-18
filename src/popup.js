const $ = (sel) => document.querySelector(sel);

const VALID_COLORS = [
  "grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",
];

const TRACKING_PARAMS = new Set([
  "spm", "from", "isappinstalled", "bxsign", "ali_trackid", "union_lens",
  "ops_request_misc", "request_id", "biz_id", "scm", "ref", "ref_src",
]);

const SKIP_PROTOCOLS = new Set([
  "edge:", "chrome:", "about:", "chrome-extension:", "file:", "data:", "javascript:",
]);

const DUPLICATE_PREVIEW_LIMIT = 3;
const CLEANUP_PREVIEW_LIMIT = 4;
const EXPORT_SCHEMA_VERSION = "1.0";
const GROUPS_SCHEMA_VERSION = "1.0";

let selectedImportGroups = null;
let selectedImportFileName = "";
let importDropDepth = 0;
let currentLang = "en";

const MESSAGES = {
  en: {
    appTitle: "Tab Organize",
    languageLabel: "Language",
    step1Title: "Export Tabs JSON",
    tabCountLine: 'Current window: <strong id="tabCount">--</strong> tabs',
    step1Hint: "Export a standard JSON file. Saving it to the desktop is recommended so it can be used later to generate grouping output.",
    exportButton: "Export JSON File",
    step2Title: "Duplicate Tab Cleanup",
    duplicateSummaryLine: 'Detected <strong id="duplicateGroupCount">--</strong> duplicate groups, with <strong id="duplicateTabCount">--</strong> tabs available to close',
    step2Hint: "Deduplicate by normalized URL, preferring pinned, active, and earlier tabs.",
    rescanButton: "Rescan",
    dedupeButton: "Close Duplicates",
    step3Title: "Common Tab Cleanup",
    cleanupSummaryLine: 'Detected <strong id="cleanupTabCount">--</strong> optional cleanup tabs',
    step3Hint: "Only Bilibili home tabs and new-tab pages are included. Search pages are not affected.",
    cleanupButton: "Close These Tabs",
    step4Title: "Import Groups JSON",
    step4Hint: "Choose a standard groups JSON file, ideally from the desktop. You can also drag a desktop JSON file into the area below.",
    dropZoneTitle: "Drop Groups JSON Here",
    dropZoneSubtitle: "Or use the button below to choose a file",
    noGroupFileSelected: "No groups JSON file selected",
    pickFileButton: "Choose Groups JSON",
    applyGroupsButton: "Apply Groups",
    statusNoDuplicates: "No duplicate tabs were detected in the current window.",
    statusDuplicateScanFailed: "Scan failed: {message}",
    statusNoDuplicatesToClose: "No duplicate tabs need to be closed in the current window.",
    statusCancelDedupe: "Duplicate-tab cleanup was cancelled.",
    statusDedupeDone: "Closed {count} duplicate tabs and kept the primary tab for {groups} groups.",
    statusDedupeFailed: "Deduplication failed: {message}",
    statusNoCleanupTabs: "No optional cleanup tabs were detected in the current window.",
    statusCleanupScanFailed: "Scan failed: {message}",
    statusNoCleanupToClose: "No optional cleanup tabs need to be closed in the current window.",
    statusCancelCleanup: "Common-tab cleanup was cancelled.",
    statusCleanupDone: "Closed {count} common tabs.",
    statusCleanupFailed: "Cleanup failed: {message}",
    cleanupLabelBilibili: "Bilibili Home",
    cleanupLabelNewTab: "New Tab",
    duplicatePreview: "Detected {groups} duplicate groups and {count} tabs can be closed. Examples: {preview}",
    duplicatePreviewShort: "Detected {groups} duplicate groups and {count} tabs can be closed.",
    duplicateKeepMessage: '{index}. Keep "{title}", close {count}',
    duplicateConfirmSuffix: "\n... plus {count} more duplicate groups",
    duplicateConfirm: "This will close {count} duplicate tabs.\nPinned, active, and earlier tabs are preferred.\n\n{preview}{suffix}\n\nContinue?",
    cleanupPreview: "Detected {count} optional cleanup tabs. Examples: {preview}",
    cleanupPreviewShort: "Detected {count} optional cleanup tabs.",
    cleanupItem: "{index}. {label}",
    cleanupConfirmItem: "{index}. {label}: {title}",
    cleanupConfirmSuffix: "\n... plus {count} more",
    cleanupConfirm: "This will close {count} common tabs.\nOnly Bilibili home tabs and new-tab pages are included.\n\n{preview}{suffix}\n\nContinue?",
    statusExportDone: "Exported {count} tabs to {file}. Saving to the desktop is recommended for downstream grouping.",
    statusExportCancelled: "Export cancelled.",
    statusExportFailed: "Export failed: {message}",
    jsonFileDescription: "JSON Files",
    jsonFileDescriptionPlural: "JSON Files",
    savePickerUnsupported: "This browser does not support standard JSON export.",
    statusPickCancelled: "File selection cancelled.",
    statusPickFailed: "File selection failed: {message}",
    statusOnlyJsonDrag: "Only standard JSON files are supported.",
    statusDropLoadFailed: "Failed to load dropped file: {message}",
    parseChooseJson: "Please choose a .json file.",
    parseTopObject: "The JSON root must be an object.",
    parseMissingGroups: "The JSON is missing a valid groups array.",
    parseGroupNotObject: "Group {index} is not an object.",
    parseGroupName: "Group {index} is missing a valid name.",
    parseGroupTabs: "Group {index} is missing a valid tabs array.",
    fileMetaSelected: "Selected: {file} ({count} groups)",
    statusLoadedFile: "Loaded {file} with {count} groups.",
    statusNeedFile: "Please choose a standard groups JSON file first.",
    statusImportDone: "Applied {count} groups from {file}.",
    statusImportFailed: "Applying groups failed: {message}",
    parseNoJson: "No valid JSON data was found.",
    exportTask: "Group the tabs in the current window by topic or use case.",
    exampleGroupName: "Group Name",
  },
  "zh-CN": {
    appTitle: "标签页智能分组",
    languageLabel: "语言",
    step1Title: "导出标签页 JSON",
    tabCountLine: '当前窗口共 <strong id="tabCount">--</strong> 个标签页',
    step1Hint: "导出标准 JSON 文件，建议直接保存到桌面，后续我会基于这个文件帮你生成分组文件。",
    exportButton: "导出 JSON 文件",
    step2Title: "重复标签去重",
    duplicateSummaryLine: '当前窗口检测到 <strong id="duplicateGroupCount">--</strong> 组重复标签，可关闭 <strong id="duplicateTabCount">--</strong> 个',
    step2Hint: "按规范化 URL 去重，优先保留已固定、当前活跃、靠前的标签页。",
    rescanButton: "重新扫描",
    dedupeButton: "关闭重复标签",
    step3Title: "常见标签清理",
    cleanupSummaryLine: '当前窗口检测到 <strong id="cleanupTabCount">--</strong> 个可选清理标签',
    step3Hint: "仅扫描 B 站首页和新建标签页，搜索页不会被纳入清理。",
    cleanupButton: "关闭这些标签",
    step4Title: "导入分组 JSON",
    step4Hint: "选择我整理后生成的标准分组 JSON 文件，建议也放在桌面；也支持直接把桌面 JSON 拖进下方区域。",
    dropZoneTitle: "拖拽分组 JSON 到这里",
    dropZoneSubtitle: "也可以继续使用下方按钮选择文件",
    noGroupFileSelected: "未选择分组 JSON 文件",
    pickFileButton: "选择分组 JSON",
    applyGroupsButton: "应用分组",
    statusNoDuplicates: "当前窗口没有检测到重复标签。",
    statusDuplicateScanFailed: "扫描失败：{message}",
    statusNoDuplicatesToClose: "当前窗口没有需要关闭的重复标签。",
    statusCancelDedupe: "已取消关闭重复标签。",
    statusDedupeDone: "已关闭 {count} 个重复标签，保留 {groups} 组中的主标签。",
    statusDedupeFailed: "去重失败：{message}",
    statusNoCleanupTabs: "当前窗口没有检测到可选清理标签。",
    statusCleanupScanFailed: "扫描失败：{message}",
    statusNoCleanupToClose: "当前窗口没有需要关闭的可选清理标签。",
    statusCancelCleanup: "已取消常见标签清理。",
    statusCleanupDone: "已关闭 {count} 个常见标签。",
    statusCleanupFailed: "清理失败：{message}",
    cleanupLabelBilibili: "B站首页",
    cleanupLabelNewTab: "新建标签页",
    duplicatePreview: "检测到 {groups} 组重复标签，可关闭 {count} 个。示例：{preview}",
    duplicatePreviewShort: "检测到 {groups} 组重复标签，可关闭 {count} 个。",
    duplicateKeepMessage: "{index}. 保留「{title}」，关闭 {count} 个",
    duplicateConfirmSuffix: "\n... 另有 {count} 组重复标签",
    duplicateConfirm: "将关闭 {count} 个重复标签。\n优先保留已固定、当前活跃、靠前的标签页。\n\n{preview}{suffix}\n\n是否继续？",
    cleanupPreview: "检测到 {count} 个可选清理标签。示例：{preview}",
    cleanupPreviewShort: "检测到 {count} 个可选清理标签。",
    cleanupItem: "{index}. {label}",
    cleanupConfirmItem: "{index}. {label}：{title}",
    cleanupConfirmSuffix: "\n... 另有 {count} 个",
    cleanupConfirm: "将关闭 {count} 个常见标签。\n仅包含 B站首页 和 新建标签页，B站搜索页不会被关闭。\n\n{preview}{suffix}\n\n是否继续？",
    statusExportDone: "已导出 {count} 个标签页到 {file}。建议保存到桌面后再让我读取这个文件。",
    statusExportCancelled: "已取消导出。",
    statusExportFailed: "导出失败：{message}",
    jsonFileDescription: "JSON 文件",
    jsonFileDescriptionPlural: "JSON 文件",
    savePickerUnsupported: "当前浏览器不支持标准 JSON 文件导出",
    statusPickCancelled: "已取消选择分组文件。",
    statusPickFailed: "选择文件失败：{message}",
    statusOnlyJsonDrag: "只支持拖入标准 JSON 文件。",
    statusDropLoadFailed: "加载拖拽文件失败：{message}",
    parseChooseJson: "请选择 .json 文件",
    parseTopObject: "JSON 顶层必须是对象",
    parseMissingGroups: "JSON 缺少有效的 groups 数组",
    parseGroupNotObject: "第 {index} 个分组不是对象",
    parseGroupName: "第 {index} 个分组缺少有效名称",
    parseGroupTabs: "第 {index} 个分组缺少有效 tabs 数组",
    fileMetaSelected: "已选择：{file}（{count} 个分组）",
    statusLoadedFile: "已加载 {file}，共 {count} 个分组。",
    statusNeedFile: "请先选择标准分组 JSON 文件",
    statusImportDone: "已从 {file} 应用 {count} 个分组。",
    statusImportFailed: "应用分组失败：{message}",
    parseNoJson: "未找到有效的 JSON 数据",
    exportTask: "按主题或用途对当前窗口标签页分组",
    exampleGroupName: "组名",
  },
};

// ── 初始化 ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  currentLang = getInitialLanguage();
  applyI18n();
  $("#languageSelect").value = currentLang;
  await refreshWindowStats();
  updateImportFileMeta();

  $("#exportBtn").addEventListener("click", handleExport);
  $("#scanBtn").addEventListener("click", handleScanDuplicates);
  $("#dedupeBtn").addEventListener("click", handleDedupe);
  $("#scanCleanupBtn").addEventListener("click", handleScanCleanupTabs);
  $("#cleanupBtn").addEventListener("click", handleCleanupTabs);
  $("#pickFileBtn").addEventListener("click", handlePickGroupFile);
  $("#importBtn").addEventListener("click", handleImport);
  $("#fileInput").addEventListener("change", handleFallbackFileInput);
  $("#languageSelect").addEventListener("change", handleLanguageChange);
  initImportDropZone();
});

function getInitialLanguage() {
  const saved = localStorage.getItem("tab-organize.lang");
  if (saved && MESSAGES[saved]) return saved;
  const ui = chrome.i18n?.getUILanguage?.() || navigator.language || "en";
  return ui.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

function handleLanguageChange(event) {
  const nextLang = event.target.value;
  if (!MESSAGES[nextLang]) return;
  currentLang = nextLang;
  localStorage.setItem("tab-organize.lang", currentLang);
  applyI18n();
  updateImportFileMeta(selectedImportFileName, selectedImportGroups?.length || 0);
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t("appTitle");
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-html]")) {
    node.innerHTML = t(node.dataset.i18nHtml);
  }
  $("#importDropZone")?.setAttribute("aria-label", t("step4Title"));
}

function t(key, vars = {}) {
  const table = MESSAGES[currentLang] || MESSAGES.en;
  let text = table[key] ?? MESSAGES.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

// ── 统计与去重扫描 ──────────────────────────────────────
async function refreshWindowStats() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  $("#tabCount").textContent = tabs.length;

  const duplicateScan = scanDuplicates(tabs);
  $("#duplicateGroupCount").textContent = duplicateScan.duplicateGroupCount;
  $("#duplicateTabCount").textContent = duplicateScan.duplicateTabCount;

  const cleanupScan = scanCleanupTabs(tabs);
  $("#cleanupTabCount").textContent = cleanupScan.cleanupTabCount;

  return { tabs, duplicateScan, cleanupScan };
}

async function handleScanDuplicates() {
  try {
    const { duplicateScan } = await refreshWindowStats();
    if (duplicateScan.duplicateGroupCount === 0) {
      showStatus("dedupeStatus", "success", t("statusNoDuplicates"));
      return;
    }

    showStatus("dedupeStatus", "info", formatDuplicateSummary(duplicateScan));
  } catch (err) {
    showStatus("dedupeStatus", "error", t("statusDuplicateScanFailed", { message: err.message }));
  }
}

async function handleDedupe() {
  try {
    const { duplicateScan } = await refreshWindowStats();
    if (duplicateScan.duplicateGroupCount === 0) {
      showStatus("dedupeStatus", "success", t("statusNoDuplicatesToClose"));
      return;
    }

    const confirmed = window.confirm(buildDedupeConfirmMessage(duplicateScan));
    if (!confirmed) {
      showStatus("dedupeStatus", "info", t("statusCancelDedupe"));
      return;
    }

    await chrome.tabs.remove(duplicateScan.duplicateTabIds);
    await refreshWindowStats();
    showStatus(
      "dedupeStatus",
      "success",
      t("statusDedupeDone", { count: duplicateScan.duplicateTabCount, groups: duplicateScan.duplicateGroupCount }),
    );
  } catch (err) {
    showStatus("dedupeStatus", "error", t("statusDedupeFailed", { message: err.message }));
  }
}

async function handleScanCleanupTabs() {
  try {
    const { cleanupScan } = await refreshWindowStats();
    if (cleanupScan.cleanupTabCount === 0) {
      showStatus("cleanupStatus", "success", t("statusNoCleanupTabs"));
      return;
    }

    showStatus("cleanupStatus", "info", formatCleanupSummary(cleanupScan));
  } catch (err) {
    showStatus("cleanupStatus", "error", t("statusCleanupScanFailed", { message: err.message }));
  }
}

async function handleCleanupTabs() {
  try {
    const { cleanupScan } = await refreshWindowStats();
    if (cleanupScan.cleanupTabCount === 0) {
      showStatus("cleanupStatus", "success", t("statusNoCleanupToClose"));
      return;
    }

    const confirmed = window.confirm(buildCleanupConfirmMessage(cleanupScan));
    if (!confirmed) {
      showStatus("cleanupStatus", "info", t("statusCancelCleanup"));
      return;
    }

    await chrome.tabs.remove(cleanupScan.cleanupTabIds);
    await refreshWindowStats();
    showStatus("cleanupStatus", "success", t("statusCleanupDone", { count: cleanupScan.cleanupTabCount }));
  } catch (err) {
    showStatus("cleanupStatus", "error", t("statusCleanupFailed", { message: err.message }));
  }
}

function scanDuplicates(tabs) {
  const groupsByUrl = new Map();

  for (const tab of tabs) {
    const normalizedUrl = normalizeUrl(resolveTabUrl(tab));
    if (!normalizedUrl) continue;

    const list = groupsByUrl.get(normalizedUrl) || [];
    list.push(tab);
    groupsByUrl.set(normalizedUrl, list);
  }

  const groups = [];
  let duplicateTabCount = 0;

  for (const [normalizedUrl, groupTabs] of groupsByUrl.entries()) {
    if (groupTabs.length < 2) continue;

    const sorted = [...groupTabs].sort(compareTabsForKeep);
    const keepTab = sorted[0];
    const duplicateTabs = sorted.slice(1).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    duplicateTabCount += duplicateTabs.length;
    groups.push({
      normalizedUrl,
      keepTab,
      duplicateTabs,
      totalCount: groupTabs.length,
    });
  }

  groups.sort((a, b) => (a.keepTab.index ?? 0) - (b.keepTab.index ?? 0));

  return {
    groups,
    duplicateGroupCount: groups.length,
    duplicateTabCount,
    duplicateTabIds: groups.flatMap((group) => group.duplicateTabs.map((tab) => tab.id)),
  };
}

function scanCleanupTabs(tabs) {
  const cleanupTabs = [];

  for (const tab of tabs) {
    const url = resolveTabUrl(tab);
    const type = classifyCleanupTab(url);
    if (!type) continue;

    cleanupTabs.push({
      id: tab.id,
      index: tab.index ?? 0,
      title: tab.title || "",
      url,
      type,
      label: type === "bilibili_home" ? t("cleanupLabelBilibili") : t("cleanupLabelNewTab"),
    });
  }

  cleanupTabs.sort((a, b) => a.index - b.index);

  return {
    cleanupTabCount: cleanupTabs.length,
    cleanupTabIds: cleanupTabs.map((tab) => tab.id),
    cleanupTabs,
  };
}

function resolveTabUrl(tab) {
  return tab.url || tab.pendingUrl || "";
}

function compareTabsForKeep(a, b) {
  if (Boolean(a.pinned) !== Boolean(b.pinned)) {
    return a.pinned ? -1 : 1;
  }
  if (Boolean(a.active) !== Boolean(b.active)) {
    return a.active ? -1 : 1;
  }
  const aIndex = a.index ?? 0;
  const bIndex = b.index ?? 0;
  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }
  return (a.id ?? 0) - (b.id ?? 0);
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) return "";

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return rawUrl.trim();
  }

  if (SKIP_PROTOCOLS.has(parsed.protocol)) {
    return "";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return rawUrl.trim();
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const port = normalizePort(protocol, parsed.port);
  let pathname = parsed.pathname || "/";
  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname !== "/") {
    pathname = pathname.replace(/\/+$/, "");
  }

  const filteredParams = Array.from(parsed.searchParams.entries())
    .filter(([key]) => !isTrackingParam(key))
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    });

  const search = filteredParams.length > 0
    ? `?${new URLSearchParams(filteredParams).toString()}`
    : "";

  return `${protocol}//${hostname}${port}${pathname}${search}`;
}

function classifyCleanupTab(rawUrl) {
  if (!rawUrl) return null;
  if (isNewTabPage(rawUrl)) return "new_tab";

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "www.bilibili.com") return null;

  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return null;

  const bilibiliHomeUrls = new Set([
    "https://www.bilibili.com/",
    "http://www.bilibili.com/",
  ]);

  return bilibiliHomeUrls.has(normalized) ? "bilibili_home" : null;
}

function isNewTabPage(rawUrl) {
  const newTabUrls = new Set([
    "edge://newtab/",
    "edge://newtab",
    "chrome://newtab/",
    "chrome://newtab",
    "about:newtab",
    "chrome-search://local-ntp/local-ntp.html",
  ]);
  return newTabUrls.has(rawUrl);
}

function normalizePort(protocol, port) {
  if (!port) return "";
  if ((protocol === "http:" && port === "80") || (protocol === "https:" && port === "443")) {
    return "";
  }
  return `:${port}`;
}

function isTrackingParam(key) {
  const lower = key.toLowerCase();
  return lower.startsWith("utm_") || TRACKING_PARAMS.has(lower);
}

function formatDuplicateSummary(scan) {
  const preview = scan.groups
    .slice(0, DUPLICATE_PREVIEW_LIMIT)
    .map((group, idx) => t("cleanupItem", {
      index: idx + 1,
      label: `${truncate(group.keepTab.title || group.normalizedUrl, 36)} (${group.totalCount})`,
    }))
    .join(currentLang === "zh-CN" ? "；" : "; ");
  return preview
    ? t("duplicatePreview", { groups: scan.duplicateGroupCount, count: scan.duplicateTabCount, preview })
    : t("duplicatePreviewShort", { groups: scan.duplicateGroupCount, count: scan.duplicateTabCount });
}

function buildDedupeConfirmMessage(scan) {
  const preview = scan.groups
    .slice(0, DUPLICATE_PREVIEW_LIMIT)
    .map((group, idx) => t("duplicateKeepMessage", {
      index: idx + 1,
      title: truncate(group.keepTab.title || group.normalizedUrl, 48),
      count: group.duplicateTabs.length,
    }))
    .join("\n");

  const suffix = scan.groups.length > DUPLICATE_PREVIEW_LIMIT
    ? t("duplicateConfirmSuffix", { count: scan.groups.length - DUPLICATE_PREVIEW_LIMIT })
    : "";
  return t("duplicateConfirm", { count: scan.duplicateTabCount, preview, suffix });
}

function formatCleanupSummary(scan) {
  const preview = scan.cleanupTabs
    .slice(0, CLEANUP_PREVIEW_LIMIT)
    .map((tab, idx) => t("cleanupItem", { index: idx + 1, label: tab.label }))
    .join(currentLang === "zh-CN" ? "；" : "; ");
  return preview
    ? t("cleanupPreview", { count: scan.cleanupTabCount, preview })
    : t("cleanupPreviewShort", { count: scan.cleanupTabCount });
}

function buildCleanupConfirmMessage(scan) {
  const preview = scan.cleanupTabs
    .slice(0, CLEANUP_PREVIEW_LIMIT)
    .map((tab, idx) => t("cleanupConfirmItem", {
      index: idx + 1,
      label: tab.label,
      title: truncate(tab.title || tab.url, 42),
    }))
    .join("\n");

  const suffix = scan.cleanupTabs.length > CLEANUP_PREVIEW_LIMIT
    ? t("cleanupConfirmSuffix", { count: scan.cleanupTabs.length - CLEANUP_PREVIEW_LIMIT })
    : "";
  return t("cleanupConfirm", { count: scan.cleanupTabCount, preview, suffix });
}

function truncate(text, limit) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

// ── 导出 ────────────────────────────────────────────────
async function handleExport() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const payload = buildExportPayload(tabs);
    const suggestedName = buildTimestampedFileName("tab-organize-export");
    const jsonText = JSON.stringify(payload, null, 2);
    const savedName = await saveJsonToDesktop(jsonText, suggestedName);
    showStatus(
      "exportStatus",
      "success",
      t("statusExportDone", { count: tabs.length, file: savedName }),
    );
  } catch (err) {
    if (err?.name === "AbortError") {
      showStatus("exportStatus", "info", t("statusExportCancelled"));
      return;
    }
    showStatus("exportStatus", "error", t("statusExportFailed", { message: err.message }));
  }
}

function buildExportPayload(tabs) {
  return {
    type: "tab-organize.export",
    version: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: {
      browser: detectBrowser(),
      windowId: tabs[0]?.windowId ?? null,
      tabCount: tabs.length,
    },
    validColors: VALID_COLORS,
    instructions: {
      task: t("exportTask"),
      outputFileNameHint: "tab-organize-groups-YYYYMMDD-HHMMSS.json",
      outputSchema: {
        type: "tab-organize.groups",
        version: GROUPS_SCHEMA_VERSION,
        groups: [{ name: t("exampleGroupName"), color: "blue", tabs: [1, 2, 3] }],
      },
    },
    tabs: tabs.map((tab, index) => ({
      index: index + 1,
      title: tab.title || "",
      url: resolveTabUrl(tab),
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
    })),
  };
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  return "Chromium";
}

async function saveJsonToDesktop(jsonText, suggestedName) {
  if ("showSaveFilePicker" in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
        startIn: "desktop",
        types: [{
        description: t("jsonFileDescription"),
        accept: { "application/json": [".json"] },
      }],
    });

    const writable = await handle.createWritable();
    await writable.write(jsonText);
    await writable.close();
    return handle.name || suggestedName;
  }

  if (chrome.downloads?.download) {
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);

    try {
      await chrome.downloads.download({
        url: objectUrl,
        filename: suggestedName,
        saveAs: true,
        conflictAction: "uniquify",
      });
      return suggestedName;
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }
  }

  throw new Error(t("savePickerUnsupported"));
}

function buildTimestampedFileName(prefix) {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const timePart = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `${prefix}-${datePart}-${timePart}.json`;
}

function pad2(num) {
  return String(num).padStart(2, "0");
}

// ── 文件导入 ────────────────────────────────────────────
async function handlePickGroupFile() {
  try {
    if ("showOpenFilePicker" in window) {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        startIn: "desktop",
        types: [{
          description: t("jsonFileDescription"),
          accept: { "application/json": [".json"] },
        }],
      });

      if (!handle) return;
      const file = await handle.getFile();
      await loadImportFile(file);
      return;
    }

    $("#fileInput").click();
  } catch (err) {
    if (err?.name === "AbortError") {
      showStatus("importStatus", "info", t("statusPickCancelled"));
      return;
    }
    showStatus("importStatus", "error", t("statusPickFailed", { message: err.message }));
  }
}

async function handleFallbackFileInput(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    await loadImportFile(file);
  } finally {
    e.target.value = "";
  }
}

function initImportDropZone() {
  const dropZone = $("#importDropZone");
  if (!dropZone) return;

  dropZone.addEventListener("click", () => {
    handlePickGroupFile();
  });

  dropZone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handlePickGroupFile();
  });

  dropZone.addEventListener("dragenter", (event) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    importDropDepth += 1;
    setImportDropZoneState(true);
  });

  dropZone.addEventListener("dragover", (event) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setImportDropZoneState(true);
  });

  dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    importDropDepth = Math.max(0, importDropDepth - 1);
    if (importDropDepth === 0) {
      setImportDropZoneState(false);
    }
  });

  dropZone.addEventListener("drop", async (event) => {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    importDropDepth = 0;
    setImportDropZoneState(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!isJsonFile(file)) {
      showStatus("importStatus", "error", t("statusOnlyJsonDrag"));
      return;
    }

    try {
      await loadImportFile(file);
    } catch (err) {
      showStatus("importStatus", "error", t("statusDropLoadFailed", { message: err.message }));
    }
  });
}

function hasDraggedFiles(event) {
  return Array.from(event.dataTransfer?.types || []).includes("Files");
}

function setImportDropZoneState(isActive) {
  $("#importDropZone")?.classList.toggle("drag-over", isActive);
}

function isJsonFile(file) {
  return /\.json$/i.test(file.name || "");
}

async function loadImportFile(file) {
  try {
    if (!isJsonFile(file)) {
      throw new Error(t("parseChooseJson"));
    }

    const text = await file.text();
    const parsed = parseJSON(text);
    const payload = normalizeGroupsPayload(parsed);

    selectedImportGroups = payload.groups;
    selectedImportFileName = file.name;
    updateImportFileMeta(file.name, payload.groups.length);
    $("#importBtn").disabled = false;
    showStatus("importStatus", "success", t("statusLoadedFile", { file: file.name, count: payload.groups.length }));
  } catch (err) {
    resetImportSelection();
    throw err;
  }
}

function normalizeGroupsPayload(data) {
  if (!data || typeof data !== "object") {
    throw new Error(t("parseTopObject"));
  }
  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    throw new Error(t("parseMissingGroups"));
  }

  const groups = data.groups.map((group, idx) => {
    if (!group || typeof group !== "object") {
      throw new Error(t("parseGroupNotObject", { index: idx + 1 }));
    }

    const name = typeof group.name === "string" ? group.name.trim() : "";
    if (!name) {
      throw new Error(t("parseGroupName", { index: idx + 1 }));
    }

    const tabs = Array.isArray(group.tabs)
      ? [...new Set(group.tabs.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
      : [];

    if (tabs.length === 0) {
      throw new Error(t("parseGroupTabs", { index: idx + 1 }));
    }

    const color = VALID_COLORS.includes(group.color) ? group.color : "grey";
    return { name, color, tabs };
  });

  return { ...data, groups };
}

function updateImportFileMeta(fileName = "", groupCount = 0) {
  const meta = $("#importFileMeta");
  if (fileName) {
    meta.textContent = t("fileMetaSelected", { file: fileName, count: groupCount });
  } else {
    meta.textContent = t("noGroupFileSelected");
  }
}

function resetImportSelection() {
  selectedImportGroups = null;
  selectedImportFileName = "";
  updateImportFileMeta();
  $("#importBtn").disabled = true;
}

// ── 清理不可见/特殊字符 ─────────────────────────────────
function sanitize(text) {
  return text
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00A0]/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "");
}

// ── 解析 JSON（兼容旧数据） ─────────────────────────────
function parseJSON(text) {
  try {
    return JSON.parse(sanitize(text));
  } catch (_) {
    // 忽略
  }

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(sanitize(codeBlockMatch[1].trim()));
  }

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return JSON.parse(sanitize(braceMatch[0]));
  }

  throw new Error("未找到有效的 JSON 数据");
}

function joinWithLocaleSeparator(items) {
  return items.join(currentLang === "zh-CN" ? "；" : "; ");
}

// ── 应用分组 ────────────────────────────────────────────
async function handleImport() {
  if (!selectedImportGroups || selectedImportGroups.length === 0) {
    showStatus("importStatus", "error", t("statusNeedFile"));
    return;
  }

  try {
    await applyGroups(selectedImportGroups);
    showStatus(
      "importStatus",
      "success",
      t("statusImportDone", {
        file: selectedImportFileName || t("pickFileButton"),
        count: selectedImportGroups.length,
      }),
    );
  } catch (err) {
    showStatus("importStatus", "error", t("statusImportFailed", { message: err.message }));
  }
}

async function applyGroups(groups) {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  for (const group of groups) {
    const tabIds = group.tabs
      .map((idx) => tabs[idx - 1])
      .filter(Boolean)
      .map((tab) => tab.id);

    if (tabIds.length === 0) continue;

    const groupId = await chrome.tabs.group({ tabIds });
    const color = VALID_COLORS.includes(group.color) ? group.color : "grey";

    await chrome.tabGroups.update(groupId, {
      title: group.name,
      color,
    });
  }
}

// ── 状态提示 ────────────────────────────────────────────
function showStatus(id, type, message) {
  const el = $(`#${id}`);
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}
