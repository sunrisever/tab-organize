const $ = (sel) => document.querySelector(sel);

const VALID_COLORS = [
  "grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange",
];

// ── 初始化 ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  $("#tabCount").textContent = tabs.length;

  $("#exportBtn").addEventListener("click", handleExport);
  $("#importBtn").addEventListener("click", handleImport);
  $("#fileBtn").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", handleFile);

  // 拖拽支持
  const ta = $("#jsonInput");
  ta.addEventListener("dragover", (e) => { e.preventDefault(); ta.classList.add("drag-over"); });
  ta.addEventListener("dragleave", () => ta.classList.remove("drag-over"));
  ta.addEventListener("drop", (e) => {
    e.preventDefault();
    ta.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  });
});

// ── 导出 ────────────────────────────────────────────────
async function handleExport() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });

    const tabList = tabs
      .map((t, i) => `${i + 1}. [${t.title}] ${t.url}`)
      .join("\n");

    const prompt = `请将以下浏览器标签页按主题/用途分组。输出严格 JSON 格式：
{"groups":[{"name":"组名","color":"颜色","tabs":[序号]}]}

可用颜色：grey, blue, red, yellow, green, pink, purple, cyan, orange

标签页列表：
${tabList}
`;

    await navigator.clipboard.writeText(prompt);
    showStatus("exportStatus", "success", "已复制到剪贴板，请粘贴给 Claude 进行分析");
  } catch (err) {
    showStatus("exportStatus", "error", "复制失败：" + err.message);
  }
}

// ── 导入 ────────────────────────────────────────────────
async function handleImport() {
  const raw = $("#jsonInput").value.trim();
  if (!raw) {
    showStatus("importStatus", "error", "请先粘贴 JSON 分组方案");
    return;
  }

  // 容错：从文本中提取 JSON 块
  let data;
  try {
    data = parseJSON(raw);
  } catch (err) {
    showStatus("importStatus", "error", "JSON 解析失败：" + err.message);
    return;
  }

  if (!Array.isArray(data.groups) || data.groups.length === 0) {
    showStatus("importStatus", "error", "JSON 格式不正确：缺少 groups 数组");
    return;
  }

  try {
    await applyGroups(data.groups);
    showStatus("importStatus", "success", `成功创建 ${data.groups.length} 个分组`);
  } catch (err) {
    showStatus("importStatus", "error", "应用分组失败：" + err.message);
  }
}

// ── 文件读取 ────────────────────────────────────────────
function handleFile(e) {
  const file = e.target.files[0];
  if (file) readFile(file);
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    $("#jsonInput").value = e.target.result;
    showStatus("importStatus", "success", `已加载文件：${file.name}`);
  };
  reader.readAsText(file, "utf-8");
}

// ── 清理不可见/特殊字符 ─────────────────────────────────
function sanitize(text) {
  return text
    // 移除零宽字符、BOM、方向控制符等
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00A0]/g, "")
    // 移除所有 ASCII 控制字符（保留空格）
    .replace(/[\x00-\x1f\x7f]/g, "");
}

// ── 解析 JSON（容错） ───────────────────────────────────
function parseJSON(text) {
  // 尝试直接解析
  try {
    return JSON.parse(sanitize(text));
  } catch (_) {
    // 忽略
  }

  // 尝试提取 ```json ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(sanitize(codeBlockMatch[1].trim()));
  }

  // 尝试提取第一个 { ... } 块
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return JSON.parse(sanitize(braceMatch[0]));
  }

  throw new Error("未找到有效的 JSON 数据");
}

// ── 应用分组 ────────────────────────────────────────────
async function applyGroups(groups) {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  for (const group of groups) {
    // 将 1-based 序号转为 tab ID
    const tabIds = group.tabs
      .map((idx) => tabs[idx - 1])
      .filter(Boolean)
      .map((t) => t.id);

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
