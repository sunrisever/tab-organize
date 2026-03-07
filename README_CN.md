[English](README.md) | 简体中文

# 标签页智能分组 — AI 驱动的浏览器标签页分组扩展

借助 AI（Claude、ChatGPT 等）对浏览器标签页进行智能分组整理的 Edge/Chrome 扩展。

## 功能

- 一键导出当前窗口所有标签页信息
- AI 智能分析生成分组方案（支持 Claude、ChatGPT 等任意 LLM）
- 拖拽/粘贴/文件导入分组 JSON
- 自动应用分组到浏览器标签页
- 9 种分组颜色可选
- 兼容 Edge 和 Chrome
- **AI 编程助手支持**：内置 `CLAUDE.md` 和 `AGENTS.md`，兼容 Claude Code、Codex、OpenCode、OpenClaw

## 工作流程

```
1. 点击扩展 → "导出到剪贴板" → 标签页信息 + 提示词复制到剪贴板
2. 粘贴给 AI（Claude/ChatGPT 等）→ AI 智能分析输出分组 JSON
3. 回到扩展 → 导入 JSON（粘贴/拖拽/选择文件）→ "应用分组" → 标签页自动归类
```

## 安装方法

1. 打开浏览器，地址栏输入 `edge://extensions/` 或 `chrome://extensions/`
2. 开启右上角 **开发人员模式**
3. 点击 **加载解压缩的扩展**
4. 选择 `src` 文件夹

## 使用方法

### 步骤 1：导出

点击扩展图标，点击 **导出到剪贴板**，当前窗口所有标签页的信息（标题 + URL）会连同提示词一起复制到剪贴板。

### 步骤 2：让 AI 分析

将剪贴板内容粘贴给 AI（Claude、ChatGPT、DeepSeek 等），AI 会返回如下格式的 JSON：

```json
{
  "groups": [
    { "name": "组名", "color": "blue", "tabs": [1, 2, 3] }
  ]
}
```

其中 `tabs` 里的数字对应导出时标签页的序号（从 1 开始）。

### 步骤 3：导入并应用

回到扩展弹窗，通过以下任一方式导入 JSON：

- **粘贴** — 直接粘贴到文本框
- **拖拽** — 将 `.json` 文件拖到文本框
- **选择文件** — 点击"选择文件"按钮

然后点击 **应用分组**，标签页就会自动归类。

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
└── output/             ← AI 输出的分组 JSON 示例
    └── groups.json
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `tabs` | 读取标签页标题和 URL，创建标签页分组 |
| `tabGroups` | 设置分组名称和颜色 |

## 注意事项

- 导出和导入针对的是 **当前窗口** 的标签页，多窗口需分别操作
- 标签页序号在导出时确定，导入前请勿增删标签页，否则序号会错位
- 如粘贴 JSON 解析失败，建议改用文件导入方式

## 开源协议

MIT
