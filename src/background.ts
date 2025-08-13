import browser from "webextension-polyfill";
import { getGlobalPluginManager } from "./core/plugin-manager";
// 静态导入插件
import textSummaryPlugin from "./plugins/text-summary/01-text-summary.plugin";

console.log("Hello from the background!");

const defaultGlobalPluginManager = getGlobalPluginManager();

// 初始化背景脚本
async function initializeBackground() {
  try {
    console.log("🚀 Initializing background script...");

    // 初始化插件管理器
    await defaultGlobalPluginManager.initialize();

    // 手动注册插件
    await defaultGlobalPluginManager.registerPlugin(textSummaryPlugin);

    // 监听来自 content script 的功能执行请求
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Background received message:", message.type);

      if (message.type === "EXECUTE_FEATURE") {
        // 处理异步功能执行
        (async () => {
          try {
            console.log(
              `📨 Received feature execution request: ${message.featureId}`
            );
            const result = await defaultGlobalPluginManager.executeFeature(
              message.featureId,
              message.implementation,
              message.context
            );
            console.log(
              "📬 Feature execution result in background.ts:",
              result
            );
            sendResponse(result);
          } catch (error) {
            console.error("❌ Feature execution failed:", error);
            sendResponse({ success: false, error: String(error) });
          }
        })();
        return true; // 保持消息通道开放用于异步响应
      }

      if (message.type === "GET_PLUGIN_STATUS") {
        try {
          const status = defaultGlobalPluginManager.getAllPluginStatus();
          sendResponse({ success: true, status });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
        return true;
      }

      return false; // 其他消息类型不处理
    });

    console.log("✅ Background script initialized");
  } catch (error) {
    console.error("❌ Failed to initialize background script:", error);
  }
}

browser.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed:", details);
  // 在扩展安装/更新时也初始化
  await initializeBackground();
});

// 立即初始化
initializeBackground();

// 集成文本总结功能
import "./plugins/text-summary/03-background-extension";
