[English](README.md) | 简体中文

# 标签页智能分组 — AI 驱动的浏览器标签页分组扩展

借助 AI（Claude、ChatGPT 等）对浏览器标签页进行智能分组整理的 Edge/Chrome 扩展。

## 功能

- 一键导出当前窗口标签页为标准 JSON 文件
- 当前窗口重复标签扫描与一键去重
- 当前窗口常见标签清理：B 站首页、新建标签页
- AI 智能分析生成分组方案（支持 Claude、ChatGPT 等任意 LLM）
- 标准 JSON 文件导入分组方案
- 自动应用分组到浏览器标签页
- 9 种分组颜色可选
- 兼容 Edge 和 Chrome
- **AI 编程助手支持**：内置 `CLAUDE.md` 和 `AGENTS.md`，兼容 Claude Code、Codex、OpenCode、OpenClaw

## 工作流程

```
1. 点击扩展，可先用“重复标签去重”清理当前窗口里的重复网页
2. 如有需要，再用“常见标签清理”关闭 B 站首页和新建标签页
3. 点击“导出 JSON 文件” → 将 `tab-organize-export-*.json` 保存到桌面
4. 把该 JSON 文件交给 AI（如 Codex）整理 → 生成 `tab-organize-groups-*.json`
5. 将分组 JSON 也保存到桌面
6. 回到扩展 → 选择分组 JSON，或直接把分组 JSON 拖进弹窗 → “应用分组” → 标签页自动归类
```

## 安装方法

1. 打开浏览器，地址栏输入 `edge://extensions/` 或 `chrome://extensions/`
2. 开启右上角 **开发人员模式**
3. 点击 **加载解压缩的扩展**
4. 选择 `src` 文件夹

## 使用方法

### 快速去重

打开扩展后，弹窗会自动扫描当前窗口里的重复标签，并显示：

- 重复标签组数
- 可关闭的重复标签数量

点击 **关闭重复标签** 后，会按规范化 URL 去重，默认优先保留：

- 已固定的标签页
- 当前活跃标签页
- 更靠前的标签页

链接中的 `utm_*`、`spm`、`from` 等常见追踪参数会自动忽略，所以同一网页的“带参数版”和“干净版”也能识别成重复。

### 常见标签清理

弹窗还会扫描一类“可选清理标签”，并提供单独按钮手动关闭。目前只包含：

- `https://www.bilibili.com/` 这类 B 站首页标签
- 新建标签页

不会包含：

- `https://search.bilibili.com/...` 这类 B 站搜索页

这部分清理完全是手动触发，不会自动删除。

### 步骤 1：导出

点击扩展图标，点击 **导出 JSON 文件**，将当前窗口标签页导出为标准 JSON 文件。

建议文件名保持默认格式：

- `tab-organize-export-YYYYMMDD-HHMMSS.json`

建议直接保存到桌面，后续可以让我直接读取这个文件。

### 步骤 2：让 AI 分析

将导出的 JSON 文件交给 AI（Claude、ChatGPT、Codex、DeepSeek 等），AI 应返回标准分组 JSON 文件，例如：

```json
{
  "type": "tab-organize.groups",
  "version": "1.0",
  "groups": [
    { "name": "组名", "color": "blue", "tabs": [1, 2, 3] }
  ]
}
```

其中 `tabs` 里的数字对应导出文件中标签页的序号（从 1 开始）。

建议分组文件名：

- `tab-organize-groups-YYYYMMDD-HHMMSS.json`

### 步骤 3：导入并应用

回到扩展弹窗后，你可以任选一种方式导入 AI 生成的标准分组文件：

- 点击 **选择分组 JSON**
- 直接把桌面上的 `.json` 文件拖进弹窗里的导入区域

导入完成后，点击 **应用分组**。

推荐把分组文件也放在桌面，方便 AI 与扩展来回协同。

## 可用分组颜色

`grey` `blue` `red` `yellow` `green` `pink` `purple` `cyan` `orange`

## 文件结构

```
├── README.md
├── README_CN.md
├── CLAUDE.md / AGENTS.md
├── src/                ← 加载此文件夹作为扩展
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   ├── background.js
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── output/             ← 示例 JSON 文件
    ├── export.example.json
    └── groups.json
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `tabs` | 读取标签页标题和 URL，创建标签页分组 |
| `tabGroups` | 设置分组名称和颜色 |
| `downloads` | 在文件系统 API 不可用时，调起另存为对话框导出 JSON 文件 |

## 注意事项

- 导出和导入针对的是 **当前窗口** 的标签页，多窗口需分别操作
- 重复标签去重也只作用于 **当前窗口**
- 常见标签清理也只作用于 **当前窗口**
- 标签页序号在导出时确定，导入前请勿增删标签页，否则序号会错位
- 普通 Edge 会话推荐统一走“桌面 JSON 文件导出 / 导入”流程，不再依赖剪贴板长文本

## 开源协议

MIT
