/**
 * Content Script for Text Summary Plugin
 * 运行在每个网页中，处理用户交互和文本总结功能
 */

import { PluginManager } from "../../core/plugin-manager";
import textSummaryPlugin from "./text-summary.plugin";

class ContentScriptManager {
  private pluginManager: PluginManager;
  private isInitialized = false;

  constructor() {
    this.pluginManager = new PluginManager();
    this.init();
  }

  /**
   * 初始化内容脚本
   */
  private async init(): Promise<void> {
    try {
      console.log("🚀 Initializing Text Summary Content Script...");

      // 等待DOM加载完成
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.initializePlugin()
        );
      } else {
        await this.initializePlugin();
      }

      // 监听来自background script的消息
      this.setupMessageListener();

      console.log("✅ Text Summary Content Script initialized");
    } catch (error) {
      console.error("❌ Failed to initialize content script:", error);
    }
  }

  /**
   * 初始化插件
   */
  private async initializePlugin(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化插件管理器
      await this.pluginManager.initialize();

      // 加载文本总结插件
      await this.pluginManager.loadPlugin(textSummaryPlugin);

      // 配置插件（可以从存储中读取用户配置）
      await this.configurePlugin();

      this.isInitialized = true;
      console.log("✅ Text Summary Plugin loaded successfully");
    } catch (error) {
      console.error("❌ Failed to initialize plugin:", error);
    }
  }

  /**
   * 配置插件
   */
  private async configurePlugin(): Promise<void> {
    try {
      // 从扩展存储中读取配置
      const result = await chrome.storage.sync.get({
        apiUrl: "https://api.openai.com/v1/chat/completions", // 默认API
        apiKey: "",
        maxLength: 200,
        language: "zh-CN",
      });

      await textSummaryPlugin.setConfig({
        settings: result,
      });

      console.log("📝 Plugin configured with settings:", result);
    } catch (error) {
      console.warn("⚠️ Failed to load plugin configuration:", error);

      // 使用默认配置
      await textSummaryPlugin.setConfig({
        settings: {
          apiUrl: "",
          apiKey: "",
          maxLength: 200,
          language: "zh-CN",
        },
      });
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "SUMMARY_REQUESTED":
          this.handleSummaryRequest(message.selectedText);
          sendResponse({ success: true });
          break;

        case "UPDATE_CONFIG":
          this.updateConfig(message.config);
          sendResponse({ success: true });
          break;

        case "GET_PLUGIN_STATUS":
          sendResponse({
            success: true,
            status: this.pluginManager.getPluginStatus(),
          });
          break;

        default:
          return false;
      }

      return true; // 保持消息通道开放
    });
  }

  /**
   * 处理总结请求
   */
  private async handleSummaryRequest(selectedText: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn("⚠️ Plugin not initialized yet");
      return;
    }

    try {
      // 检查选中的文本
      if (!selectedText || selectedText.trim().length < 10) {
        this.showNotification("请选择至少10个字符的文本进行总结", "warning");
        return;
      }

      // 显示加载状态
      this.showNotification("🤖 正在生成总结...", "info");

      // 创建执行上下文
      const context = {
        siteConfig: {
          id: "current-site",
          name: window.location.hostname,
          urlRules: [
            {
              pattern: window.location.href,
              type: "exact" as const,
              include: true,
            },
          ],
          enabledFeatures: [
            {
              featureId: "text-summary",
              enabled: true,
              settings: {},
            },
          ],
        },
        settings: { selectedText },
        document: document,
        storage: chrome.storage,
        url: window.location.href,
      };

      // 执行总结功能
      const result = await this.pluginManager.executeFeature(
        "text-summary",
        undefined,
        context
      );

      if (result.success) {
        this.showSummaryResult(selectedText, result.actions?.[0] || "总结完成");
      } else {
        this.showNotification(`总结失败: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("❌ Summary request failed:", error);
      this.showNotification("总结请求失败，请稍后重试", "error");
    }
  }

  /**
   * 更新配置
   */
  private async updateConfig(config: any): Promise<void> {
    try {
      await textSummaryPlugin.setConfig({ settings: config });
      console.log("✅ Plugin configuration updated");
    } catch (error) {
      console.error("❌ Failed to update configuration:", error);
    }
  }

  /**
   * 显示通知
   */
  private showNotification(
    message: string,
    type: "info" | "warning" | "error"
  ): void {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 300px;
      color: white;
      background: ${
        type === "error"
          ? "#ff4444"
          : type === "warning"
          ? "#ff8800"
          : "#007acc"
      };
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(
      () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      },
      type === "info" ? 3000 : 5000
    );
  }

  /**
   * 显示总结结果
   */
  private showSummaryResult(originalText: string, summary: string): void {
    // 创建背景遮罩
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;

    // 创建结果弹窗
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: modalSlideIn 0.3s ease-out;
    `;

    // 添加动画样式
    const style = document.createElement("style");
    style.textContent = `
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -60%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
    `;
    document.head.appendChild(style);

    modal.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">📝</span> AI 文本总结
        </h3>
        <button id="close-summary" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="padding: 24px; max-height: 400px; overflow-y: auto;">
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 600;">原文：</h4>
          <div style="
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #007acc;
            font-size: 14px;
            line-height: 1.6;
            max-height: 120px;
            overflow-y: auto;
            color: #333;
          ">${originalText}</div>
        </div>
        <div>
          <h4 style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-weight: 600;">AI 总结：</h4>
          <div style="
            background: #e8f5e8;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
          ">${summary}</div>
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button id="copy-summary" style="
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 8px;
          ">📋 复制总结</button>
          <button id="save-summary" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
          ">💾 保存</button>
        </div>
      </div>
    `;

    // 添加事件监听器
    const setupEvents = () => {
      const closeBtn = modal.querySelector("#close-summary") as HTMLElement;
      const copyBtn = modal.querySelector("#copy-summary") as HTMLElement;
      const saveBtn = modal.querySelector("#save-summary") as HTMLElement;

      const closeModal = () => {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      };

      closeBtn?.addEventListener("click", closeModal);
      overlay.addEventListener("click", closeModal);

      copyBtn?.addEventListener("click", () => {
        navigator.clipboard.writeText(summary).then(() => {
          this.showNotification("总结已复制到剪贴板", "info");
        });
      });

      saveBtn?.addEventListener("click", () => {
        // 保存到本地存储或发送到background script
        chrome.storage.local.get({ summaryHistory: [] }, (result) => {
          const history = result.summaryHistory;
          history.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            originalText: originalText.substring(0, 500),
            summary: summary,
          });

          if (history.length > 50) {
            history.splice(50);
          }

          chrome.storage.local.set({ summaryHistory: history }, () => {
            this.showNotification("总结已保存到历史记录", "info");
          });
        });
      });
    };

    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    setupEvents();
  }
}

// 初始化内容脚本
new ContentScriptManager();
