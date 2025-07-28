# 🚀 Chrome 扩展集成指南

这个文档说明如何将文本总结插件集成到现有的 Chrome 扩展中，保持原有文件的最小修改。

## 📁 新增文件

我们在 `src/plugins/text-summary/` 目录下创建了以下新文件：

```
src/plugins/text-summary/
├── content-script.ts           # Content Script - 处理网页交互
├── background-extension.ts     # Background Script扩展 - 右键菜单
├── popup-extension.tsx         # Popup界面扩展 - 设置和历史
└── integration-guide.md        # 本集成指南
```

## 🔧 需要修改的现有文件

为了完整集成功能，需要对以下现有文件进行**最小修改**：

### 1. `src/manifest.json` - 添加权限和脚本

需要添加以下内容：

```json
{
  // 添加权限
  "permissions": ["contextMenus", "scripting", "storage", "activeTab"],

  // 添加content scripts
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["src/plugins/text-summary/content-script.js"],
      "run_at": "document_end"
    }
  ]

  // 现有的其他配置保持不变...
}
```

### 2. `src/background.ts` - 集成背景脚本

在现有文件**末尾**添加一行：

```typescript
// 现有代码保持不变...
import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details);
});

// 添加这一行来集成文本总结功能
import "./plugins/text-summary/background-extension";
```

### 3. `src/pages/Popup.tsx` - 集成设置界面

修改现有的 Popup 组件，添加文本总结的设置标签：

```tsx
import React, { useState } from "react";
import { TextSummaryPopup } from "../plugins/text-summary/popup-extension";

const Popup = () => {
  const [activeTab, setActiveTab] = useState("main");

  return (
    <div>
      {/* 现有的导航 */}
      <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
        <button
          onClick={() => setActiveTab("main")}
          style={
            {
              /* 样式 */
            }
          }
        >
          主要功能
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          style={
            {
              /* 样式 */
            }
          }
        >
          📝 文本总结
        </button>
      </div>

      {/* 内容区域 */}
      {activeTab === "main" && <div>{/* 现有的主要内容 */}</div>}

      {activeTab === "summary" && <TextSummaryPopup />}
    </div>
  );
};

export default Popup;
```

## 🎯 集成方式选择

根据你的需求，可以选择不同的集成方式：

### 方式一：完全集成（推荐）

- 修改上述 3 个文件
- 获得完整的功能体验
- 右键菜单 + 设置界面 + 历史记录

### 方式二：最小集成

- 只修改 `manifest.json` 和 `background.ts`
- 只获得右键菜单功能
- 设置需要手动配置

### 方式三：独立运行

- 创建独立的扩展入口
- 不修改现有文件
- 作为独立功能模块

## 🛠️ 构建配置

如果使用构建工具，需要确保新的 TypeScript 文件被正确编译：

### Vite 配置更新

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  // 现有配置...
  build: {
    rollupOptions: {
      input: {
        // 现有入口...
        "content-script": "src/plugins/text-summary/content-script.ts",
        "background-extension":
          "src/plugins/text-summary/background-extension.ts",
      },
    },
  },
});
```

## 📋 集成检查清单

完成集成后，请检查：

- [ ] 右键菜单显示 "📝 AI 总结选中文本"
- [ ] 选择文本后右键点击菜单有响应
- [ ] Popup 界面显示文本总结设置
- [ ] 可以保存和加载设置
- [ ] 总结历史正常工作
- [ ] 控制台没有错误信息

## 🚨 常见问题

### 1. 右键菜单不显示

- 检查 `manifest.json` 中的 `contextMenus` 权限
- 确认 `background-extension.ts` 被正确加载

### 2. Content Script 未运行

- 检查 `manifest.json` 中的 `content_scripts` 配置
- 确认文件路径正确

### 3. 设置无法保存

- 检查 `storage` 权限是否添加
- 确认 background script 正常运行

### 4. TypeScript 编译错误

- 确认所有依赖路径正确
- 检查 `tsconfig.json` 包含新文件

## 🎉 测试步骤

1. **构建扩展**：运行构建命令
2. **加载扩展**：在 Chrome 中加载扩展
3. **测试右键菜单**：在任意网页选择文本并右键
4. **配置设置**：点击扩展图标，配置 API 设置
5. **测试总结**：选择文本，右键总结，查看结果
6. **检查历史**：在 Popup 中查看总结历史

## 📈 后续扩展

集成完成后，可以轻松添加更多功能：

- 🌐 多语言总结
- 🎨 自定义总结模板
- 📊 使用统计分析
- 🔄 批量文本处理
- 📤 导出到其他应用

---

**需要我帮你修改这些文件吗？请告诉我你希望如何处理！** 🚀
