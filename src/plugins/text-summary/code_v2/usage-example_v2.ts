/**
 * 文本总结插件测试和演示
 */

// 测试导入是否正常工作
import { textSummaryFeature } from "../features/02-text-summary.feature";
import { ContextMenuManager } from "../05-context-menu-manager";
import textSummaryPlugin from "../01-text-summary.plugin";

console.log("🧪 Testing Text Summary Plugin...");

// 测试功能是否正确初始化
console.log("📋 Feature Info:", {
  id: textSummaryFeature.id,
  name: textSummaryFeature.name,
  version: textSummaryFeature.version,
});

// 测试插件是否正确初始化
console.log("🔌 Plugin Info:", {
  id: textSummaryPlugin.id,
  name: textSummaryPlugin.name,
  version: textSummaryPlugin.version,
  featuresCount: textSummaryPlugin.features.length,
});

// 模拟插件使用流程
async function testPluginFlow() {
  try {
    console.log("🚀 Starting plugin test flow...");

    // 1. 创建模拟初始化上下文
    const mockContext = {
      storage: {
        getItem: async (key: string, defaultValue: any) => ({
          success: true,
          data: defaultValue,
        }),
        setItem: async (key: string, value: any) => ({ success: true }),
      },
      messaging: null,
      settings: {},
      pluginManager: null,
    };

    // 2. 初始化插件
    await textSummaryPlugin.initialize(mockContext);
    console.log("✅ Plugin initialized");

    // 3. 激活插件
    await textSummaryPlugin.activate();
    console.log("✅ Plugin activated");

    // 4. 测试功能是否适用
    const isApplicable = textSummaryFeature.isApplicable("https://example.com");
    console.log("🎯 Feature applicable:", isApplicable);

    // 5. 模拟功能执行
    const mockExecutionContext = {
      siteConfig: {
        id: "test-site",
        name: "Example Site",
        urlRules: [],
        enabledFeatures: [{ featureId: "text-summary", enabled: true }],
      },
      settings: {
        selectedText:
          "这是一段测试文本，用于验证文本总结功能是否正常工作。这个文本足够长，可以进行有效的总结测试。",
        apiUrl: "https://api.example.com/summarize",
        maxLength: 100,
        language: "zh-CN",
      },
      document: typeof document !== "undefined" ? document : ({} as Document),
      storage: mockContext.storage,
      url: "https://example.com",
    };

    console.log("🔧 Testing feature execution...");
    const result = await textSummaryFeature.execute(mockExecutionContext);
    console.log("📝 Execution result:", result);

    // 6. 停用插件
    await textSummaryPlugin.deactivate();
    console.log("✅ Plugin deactivated");

    console.log("🎉 Plugin test completed successfully!");
  } catch (error) {
    console.error("❌ Plugin test failed:", error);
  }
}

// 运行测试（如果在浏览器环境中）
if (typeof window !== "undefined") {
  testPluginFlow();
}

export { testPluginFlow };
