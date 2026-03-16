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

// ── 初始化 ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
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
  initImportDropZone();
});

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
      showStatus("dedupeStatus", "success", "当前窗口没有检测到重复标签。");
      return;
    }

    showStatus("dedupeStatus", "info", formatDuplicateSummary(duplicateScan));
  } catch (err) {
    showStatus("dedupeStatus", "error", "扫描失败：" + err.message);
  }
}

async function handleDedupe() {
  try {
    const { duplicateScan } = await refreshWindowStats();
    if (duplicateScan.duplicateGroupCount === 0) {
      showStatus("dedupeStatus", "success", "当前窗口没有需要关闭的重复标签。");
      return;
    }

    const confirmed = window.confirm(buildDedupeConfirmMessage(duplicateScan));
    if (!confirmed) {
      showStatus("dedupeStatus", "info", "已取消关闭重复标签。");
      return;
    }

    await chrome.tabs.remove(duplicateScan.duplicateTabIds);
    await refreshWindowStats();
    showStatus(
      "dedupeStatus",
      "success",
      `已关闭 ${duplicateScan.duplicateTabCount} 个重复标签，保留 ${duplicateScan.duplicateGroupCount} 组中的主标签。`,
    );
  } catch (err) {
    showStatus("dedupeStatus", "error", "去重失败：" + err.message);
  }
}

async function handleScanCleanupTabs() {
  try {
    const { cleanupScan } = await refreshWindowStats();
    if (cleanupScan.cleanupTabCount === 0) {
      showStatus("cleanupStatus", "success", "当前窗口没有检测到可选清理标签。");
      return;
    }

    showStatus("cleanupStatus", "info", formatCleanupSummary(cleanupScan));
  } catch (err) {
    showStatus("cleanupStatus", "error", "扫描失败：" + err.message);
  }
}

async function handleCleanupTabs() {
  try {
    const { cleanupScan } = await refreshWindowStats();
    if (cleanupScan.cleanupTabCount === 0) {
      showStatus("cleanupStatus", "success", "当前窗口没有需要关闭的可选清理标签。");
      return;
    }

    const confirmed = window.confirm(buildCleanupConfirmMessage(cleanupScan));
    if (!confirmed) {
      showStatus("cleanupStatus", "info", "已取消常见标签清理。");
      return;
    }

    await chrome.tabs.remove(cleanupScan.cleanupTabIds);
    await refreshWindowStats();
    showStatus("cleanupStatus", "success", `已关闭 ${cleanupScan.cleanupTabCount} 个常见标签。`);
  } catch (err) {
    showStatus("cleanupStatus", "error", "清理失败：" + err.message);
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
      label: type === "bilibili_home" ? "B站首页" : "新建标签页",
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
    .map((group, idx) => `${idx + 1}. ${truncate(group.keepTab.title || group.normalizedUrl, 36)}（重复 ${group.totalCount} 个）`)
    .join("；");

  return preview
    ? `检测到 ${scan.duplicateGroupCount} 组重复标签，可关闭 ${scan.duplicateTabCount} 个。示例：${preview}`
    : `检测到 ${scan.duplicateGroupCount} 组重复标签，可关闭 ${scan.duplicateTabCount} 个。`;
}

function buildDedupeConfirmMessage(scan) {
  const preview = scan.groups
    .slice(0, DUPLICATE_PREVIEW_LIMIT)
    .map((group, idx) => `${idx + 1}. 保留「${truncate(group.keepTab.title || group.normalizedUrl, 48)}」，关闭 ${group.duplicateTabs.length} 个`)
    .join("\n");

  const suffix = scan.groups.length > DUPLICATE_PREVIEW_LIMIT
    ? `\n... 另有 ${scan.groups.length - DUPLICATE_PREVIEW_LIMIT} 组重复标签`
    : "";

  return `将关闭 ${scan.duplicateTabCount} 个重复标签。\n优先保留已固定、当前活跃、靠前的标签页。\n\n${preview}${suffix}\n\n是否继续？`;
}

function formatCleanupSummary(scan) {
  const preview = scan.cleanupTabs
    .slice(0, CLEANUP_PREVIEW_LIMIT)
    .map((tab, idx) => `${idx + 1}. ${tab.label}`)
    .join("；");

  return preview
    ? `检测到 ${scan.cleanupTabCount} 个可选清理标签。示例：${preview}`
    : `检测到 ${scan.cleanupTabCount} 个可选清理标签。`;
}

function buildCleanupConfirmMessage(scan) {
  const preview = scan.cleanupTabs
    .slice(0, CLEANUP_PREVIEW_LIMIT)
    .map((tab, idx) => `${idx + 1}. ${tab.label}：${truncate(tab.title || tab.url, 42)}`)
    .join("\n");

  const suffix = scan.cleanupTabs.length > CLEANUP_PREVIEW_LIMIT
    ? `\n... 另有 ${scan.cleanupTabs.length - CLEANUP_PREVIEW_LIMIT} 个`
    : "";

  return `将关闭 ${scan.cleanupTabCount} 个常见标签。\n仅包含 B站首页 和 新建标签页，B站搜索页不会被关闭。\n\n${preview}${suffix}\n\n是否继续？`;
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
      `已导出 ${tabs.length} 个标签页到 ${savedName}。建议保存到桌面后再让我读取这个文件。`,
    );
  } catch (err) {
    if (err?.name === "AbortError") {
      showStatus("exportStatus", "info", "已取消导出。");
      return;
    }
    showStatus("exportStatus", "error", "导出失败：" + err.message);
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
      task: "按主题或用途对当前窗口标签页分组",
      outputFileNameHint: "tab-organize-groups-YYYYMMDD-HHMMSS.json",
      outputSchema: {
        type: "tab-organize.groups",
        version: GROUPS_SCHEMA_VERSION,
        groups: [{ name: "组名", color: "blue", tabs: [1, 2, 3] }],
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
        description: "JSON 文件",
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

  throw new Error("当前浏览器不支持标准 JSON 文件导出");
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
          description: "JSON 文件",
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
      showStatus("importStatus", "info", "已取消选择分组文件。");
      return;
    }
    showStatus("importStatus", "error", "选择文件失败：" + err.message);
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
      showStatus("importStatus", "error", "只支持拖入标准 JSON 文件。");
      return;
    }

    try {
      await loadImportFile(file);
    } catch (err) {
      showStatus("importStatus", "error", "加载拖拽文件失败：" + err.message);
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
      throw new Error("请选择 .json 文件");
    }

    const text = await file.text();
    const parsed = parseJSON(text);
    const payload = normalizeGroupsPayload(parsed);

    selectedImportGroups = payload.groups;
    selectedImportFileName = file.name;
    updateImportFileMeta(file.name, payload.groups.length);
    $("#importBtn").disabled = false;
    showStatus("importStatus", "success", `已加载 ${file.name}，共 ${payload.groups.length} 个分组。`);
  } catch (err) {
    resetImportSelection();
    throw err;
  }
}

function normalizeGroupsPayload(data) {
  if (!data || typeof data !== "object") {
    throw new Error("JSON 顶层必须是对象");
  }
  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    throw new Error("JSON 缺少有效的 groups 数组");
  }

  const groups = data.groups.map((group, idx) => {
    if (!group || typeof group !== "object") {
      throw new Error(`第 ${idx + 1} 个分组不是对象`);
    }

    const name = typeof group.name === "string" ? group.name.trim() : "";
    if (!name) {
      throw new Error(`第 ${idx + 1} 个分组缺少有效名称`);
    }

    const tabs = Array.isArray(group.tabs)
      ? [...new Set(group.tabs.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
      : [];

    if (tabs.length === 0) {
      throw new Error(`第 ${idx + 1} 个分组缺少有效 tabs 数组`);
    }

    const color = VALID_COLORS.includes(group.color) ? group.color : "grey";
    return { name, color, tabs };
  });

  return { ...data, groups };
}

function updateImportFileMeta(fileName = "", groupCount = 0) {
  const meta = $("#importFileMeta");
  if (fileName) {
    meta.textContent = `已选择：${fileName}（${groupCount} 个分组）`;
  } else {
    meta.textContent = "未选择分组 JSON 文件";
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

// ── 应用分组 ────────────────────────────────────────────
async function handleImport() {
  if (!selectedImportGroups || selectedImportGroups.length === 0) {
    showStatus("importStatus", "error", "请先选择标准分组 JSON 文件");
    return;
  }

  try {
    await applyGroups(selectedImportGroups);
    showStatus(
      "importStatus",
      "success",
      `已从 ${selectedImportFileName || "分组文件"} 应用 ${selectedImportGroups.length} 个分组。`,
    );
  } catch (err) {
    showStatus("importStatus", "error", "应用分组失败：" + err.message);
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
