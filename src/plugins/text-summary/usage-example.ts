// 示例：如何使用文本总结插件

import { PluginManager } from "../../core/plugin-manager";
import textSummaryPlugin from "./01-text-summary.plugin";

// 使用示例
async function demonstrateTextSummaryPlugin() {
  // 1. 创建插件管理器
  const pluginManager = new PluginManager();

  // 2. 初始化插件管理器
  await pluginManager.initialize();

  // 3. 手动加载文本总结插件（通常由插件管理器自动发现）
  await pluginManager.loadPlugin(textSummaryPlugin);

  // 4. 配置插件
  await textSummaryPlugin.setConfig({
    settings: {
      apiUrl: "https://your-ai-api.com/summarize",
      apiKey: "your-api-key-here",
      maxLength: 150,
      language: "zh-CN",
    },
  });

  // 5. 插件现在会自动：
  //    - 注册右键菜单 "📝 AI总结选中文本"
  //    - 监听右键菜单点击事件
  //    - 调用API进行文本总结
  //    - 显示总结结果

  console.log("✅ 文本总结插件已激活！");
  console.log("💡 使用方法：");
  console.log("   1. 在任意网页上选择文本");
  console.log("   2. 右键点击选中的文本");
  console.log("   3. 选择 '📝 AI总结选中文本'");
  console.log("   4. 等待AI总结结果显示");
}

// API接口示例
// 你需要实现一个接收以下格式的API端点：

/*
POST /summarize
Content-Type: application/json
Authorization: Bearer your-api-key

{
  "text": "要总结的文本内容...",
  "max_length": 200,
  "language": "zh-CN",
  "timestamp": 1234567890
}

响应格式：
{
  "success": true,
  "summary": "这是AI生成的总结内容...",
  "error": null
}

或者错误响应：
{
  "success": false,
  "summary": null,
  "error": "错误描述信息"
}
*/

// 配置选项说明
interface TextSummaryPluginSettings {
  // AI API端点URL
  apiUrl: string;

  // API密钥（可选）
  apiKey?: string;

  // 总结最大长度
  maxLength: number;

  // 目标语言
  language: string;
}

// 插件功能特性
const pluginFeatures = {
  // ✅ 已实现的功能
  implemented: [
    "右键菜单集成",
    "文本选择检测",
    "API调用",
    "结果展示弹窗",
    "错误处理",
    "备用总结方案",
    "总结历史保存",
    "插件生命周期管理",
  ],

  // 🚧 可以扩展的功能
  potential: [
    "多种AI模型选择",
    "总结模板自定义",
    "批量文本总结",
    "总结质量评分",
    "导出总结到笔记应用",
    "语音播放总结",
    "快捷键支持",
    "总结风格选择（简洁/详细/要点）",
  ],
};

export { demonstrateTextSummaryPlugin, pluginFeatures };
export type { TextSummaryPluginSettings };
