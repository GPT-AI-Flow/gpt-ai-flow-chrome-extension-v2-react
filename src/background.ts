import browser from "webextension-polyfill";
import { PluginManager } from "./core/plugin-manager";

console.log("Hello from the background!");

// 全局插件管理器
const globalPluginManager = new PluginManager();

// 初始化背景脚本
async function initializeBackground() {
  try {
    console.log("🚀 Initializing background script...");
    
    // 初始化插件管理器
    await globalPluginManager.initialize();
    
    // 监听来自 content script 的功能执行请求
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.type === 'EXECUTE_FEATURE') {
        try {
          console.log(`📨 Received feature execution request: ${message.featureId}`);
          const result = await globalPluginManager.executeFeature(
            message.featureId,
            message.implementation,
            message.context
          );
          sendResponse(result);
        } catch (error) {
          console.error("❌ Feature execution failed:", error);
          sendResponse({ success: false, error: String(error) });
        }
        return true; // 保持消息通道开放
      }
      
      if (message.type === 'GET_PLUGIN_STATUS') {
        try {
          const status = globalPluginManager.getPluginStatus();
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
