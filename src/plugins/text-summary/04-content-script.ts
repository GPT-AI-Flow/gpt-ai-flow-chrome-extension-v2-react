/**
 * Content Script for Text Summary Plugin
 * 运行在每个网页中，处理用户交互和文本总结功能
 */

class ContentScriptManager {
  private isInitialized = false;
  private currentModal: HTMLElement | null = null;
  private currentOverlay: HTMLElement | null = null;

  constructor() {
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
          this.initializeContentScript()
        );
      } else {
        await this.initializeContentScript();
      }

      // 监听来自background script的消息
      this.setupMessageListener();

      console.log("✅ Text Summary Content Script initialized");
    } catch (error) {
      console.error("❌ Failed to initialize content script:", error);
    }
  }

  /**
   * 初始化内容脚本功能
   */
  private async initializeContentScript(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 内容脚本初始化完成，不再需要初始化插件管理器
      // 插件管理器在 background script 中统一管理
      this.isInitialized = true;
      console.log("✅ Text Summary Content Script loaded successfully");
    } catch (error) {
      console.error("❌ Failed to initialize content script:", error);
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
          // 请求 background script 获取插件状态
          chrome.runtime.sendMessage(
            { type: "GET_PLUGIN_STATUS" },
            (response) => {
              sendResponse(response);
            }
          );
          return true; // 异步响应
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

      // 获取当前配置
      const configResult = await chrome.storage.sync.get({
        apiUrl: "https://api.openai.com/v1/chat/completions",
        apiKey: "",
        maxLength: 200,
        language: "zh-CN",
      });

      // 创建执行上下文，包含完整的配置信息
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
        settings: {
          selectedText,
          apiUrl: configResult.apiUrl,
          apiKey: configResult.apiKey,
          maxLength: configResult.maxLength,
          language: configResult.language,
        },
        document: document,
        storage: chrome.storage,
        url: window.location.href,
      };

      // 通过消息传递请求 background script 执行功能
      const result = await new Promise<{
        success: boolean;
        actions?: string[];
        error?: string;
      }>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "EXECUTE_FEATURE",
            featureId: "text-summary",
            implementation: undefined,
            context: context,
          },
          (response) => {
            resolve(response);
          }
        );
      });

      // UI 反馈
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
      // 配置由 background script 中的插件管理器处理
      // 这里可以发送消息更新配置，或者直接保存到 storage
      await chrome.storage.sync.set(config);
      console.log("✅ Configuration updated");
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
   * 关闭现有的modal
   */
  private closeExistingModal(): void {
    // 移除现有的modal和overlay
    const existingOverlay = document.getElementById("summary-modal-overlay");
    const existingModal = document.getElementById("summary-modal");

    if (existingOverlay) {
      existingOverlay.remove();
    }
    if (existingModal) {
      existingModal.remove();
    }

    this.currentModal = null;
    this.currentOverlay = null;
  }

  /**
   * 显示总结结果
   */
  private showSummaryResult(originalText: string, summary: string): void {
    // 先清除可能存在的旧modal
    this.closeExistingModal();

    // 创建背景遮罩
    const overlay = document.createElement("div");
    overlay.id = "summary-modal-overlay";
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
    modal.id = "summary-modal";
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

    // 添加动画样式（只添加一次）
    if (!document.getElementById("summary-modal-styles")) {
      const style = document.createElement("style");
      style.id = "summary-modal-styles";
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
    }

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
        this.closeExistingModal();
      };

      closeBtn?.addEventListener("click", closeModal);
      overlay.addEventListener("click", closeModal);

      // ESC键关闭modal
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          closeModal();
          document.removeEventListener("keydown", handleEscKey);
        }
      };
      document.addEventListener("keydown", handleEscKey);

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

    // 保存引用
    this.currentModal = modal;
    this.currentOverlay = overlay;

    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    setupEvents();
  }
}

// 初始化内容脚本
new ContentScriptManager();
