/**
 * Background Script Extension for Text Summary Plugin
 * 扩展现有的background.ts功能，添加右键菜单支持
 */

import { ContextMenuManager } from "./05-context-menu-manager";

export class TextSummaryBackground {
  private static instance: TextSummaryBackground;
  private contextMenuManager?: ContextMenuManager;

  private constructor() {
    this.init();
  }

  public static getInstance(): TextSummaryBackground {
    if (!TextSummaryBackground.instance) {
      TextSummaryBackground.instance = new TextSummaryBackground();
    }
    return TextSummaryBackground.instance;
  }

  /**
   * 初始化背景脚本功能
   */
  private async init(): Promise<void> {
    try {
      console.log("🚀 Initializing Text Summary Background...");

      // 初始化默认设置
      await this.initializeDefaultSettings();

      // 初始化右键菜单管理器
      await this.initializeContextMenu();

      // 监听扩展安装/更新事件
      this.setupInstallListener();

      // 监听来自content script的消息
      this.setupMessageListener();

      console.log("✅ Text Summary Background initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Text Summary Background:", error);
    }
  }

  /**
   * 初始化右键菜单管理器
   */
  private async initializeContextMenu(): Promise<void> {
    try {
      const settings = await this.getSettings();
      this.contextMenuManager = new ContextMenuManager(settings.settings || {});

      // 注册右键菜单
      await this.contextMenuManager.initialize();

      console.log("✅ Context menu manager initialized");
    } catch (error) {
      console.error("❌ Failed to initialize context menu:", error);
    }
  }

  /**
   * 处理总结请求
   * @Test
   */
  // private async handleSummaryRequest(selectedText: string): Promise<void> {
  //   try {
  //     console.log(
  //       `🎯 Summary requested for: "${selectedText.substring(0, 50)}..."`
  //     );

  //     // 获取当前活跃的标签页
  //     const tabs = await chrome.tabs.query({
  //       active: true,
  //       currentWindow: true,
  //     });
  //     const currentTab = tabs[0];

  //     if (!currentTab?.id) {
  //       console.error("❌ No active tab found");
  //       return;
  //     }

  //     // 发送消息到content script
  //     await chrome.tabs.sendMessage(currentTab.id, {
  //       type: "SUMMARY_REQUESTED",
  //       selectedText: selectedText,
  //     });
  //   } catch (error) {
  //     console.error("❌ Failed to handle summary request:", error);

  //     // 尝试注入content script
  //     try {
  //       const tabs = await chrome.tabs.query({
  //         active: true,
  //         currentWindow: true,
  //       });
  //       const currentTab = tabs[0];

  //       if (currentTab?.id) {
  //         await this.injectContentScript(currentTab.id);

  //         // 重新发送消息
  //         setTimeout(async () => {
  //           await chrome.tabs.sendMessage(currentTab.id!, {
  //             type: "SUMMARY_REQUESTED",
  //             selectedText: selectedText,
  //           });
  //         }, 100);
  //       }
  //     } catch (injectError) {
  //       console.error("❌ Failed to inject content script:", injectError);
  //     }
  //   }
  // }

  /**
   * 注入content script
   * @Test
   */
  // private async injectContentScript(tabId: number): Promise<void> {
  //   try {
  //     await chrome.scripting.executeScript({
  //       target: { tabId },
  //       files: ["src/plugins/text-summary/04-content-script.js"],
  //     });

  //     console.log("✅ Content script injected successfully");
  //   } catch (error) {
  //     console.error("❌ Failed to inject content script:", error);
  //     throw error;
  //   }
  // }

  /**
   * 设置安装监听器
   */
  private setupInstallListener(): void {
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log("📦 Text Summary extension event:", details.reason);

      if (details.reason === "install" || details.reason === "update") {
        // 初始化默认设置
        await this.initializeDefaultSettings();

        // 重新初始化右键菜单
        await this.initializeContextMenu();
      }
    });
  }

  /**
   * 初始化默认设置
   */
  private async initializeDefaultSettings(): Promise<void> {
    try {
      const existing = await chrome.storage.sync.get({
        apiUrl: "",
        apiKey: "",
        maxLength: 200,
        language: "zh-CN",
      });

      // 如果没有配置，设置默认值
      if (!existing.apiUrl) {
        await chrome.storage.sync.set({
          apiUrl: "https://api.openai.com/v1/chat/completions",
          apiKey: "",
          maxLength: 200,
          language: "zh-CN",
        });

        console.log("📝 Default settings initialized");
      }
    } catch (error) {
      console.error("❌ Failed to initialize default settings:", error);
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "GET_SETTINGS":
          this.getSettings().then(sendResponse);
          return true; // 异步响应

        case "UPDATE_SETTINGS":
          this.updateSettings(message.settings).then(() => {
            sendResponse({ success: true });
          });
          return true;

        case "GET_SUMMARY_HISTORY":
          this.getSummaryHistory().then(sendResponse);
          return true;

        case "CLEAR_SUMMARY_HISTORY":
          this.clearSummaryHistory().then(() => {
            sendResponse({ success: true });
          });
          return true;

        case "GET_STATS":
          this.getStats().then(sendResponse);
          return true;

        default:
          return false;
      }
    });
  }

  /**
   * 获取设置
   */
  private async getSettings(): Promise<any> {
    try {
      const settings = await chrome.storage.sync.get({
        apiUrl: "https://api.openai.com/v1/chat/completions",
        apiKey: "",
        maxLength: 200,
        language: "zh-CN",
      });

      return { success: true, settings };
    } catch (error) {
      console.error("❌ Failed to get settings:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 更新设置
   */
  private async updateSettings(settings: any): Promise<void> {
    try {
      await chrome.storage.sync.set(settings);

      // 通知所有content scripts更新配置
      const tabs = await chrome.tabs.query({});
      const updatePromises = tabs.map((tab) => {
        if (tab.id) {
          return chrome.tabs
            .sendMessage(tab.id, {
              type: "UPDATE_CONFIG",
              config: settings,
            })
            .catch(() => {
              // 忽略无法发送消息的标签页
            });
        }
      });

      await Promise.all(updatePromises);
      console.log("✅ Settings updated successfully");
    } catch (error) {
      console.error("❌ Failed to update settings:", error);
      throw error;
    }
  }

  /**
   * 获取总结历史
   */
  private async getSummaryHistory(): Promise<any> {
    try {
      const result = await chrome.storage.local.get({ summaryHistory: [] });
      return { success: true, history: result.summaryHistory };
    } catch (error) {
      console.error("❌ Failed to get summary history:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 清空总结历史
   */
  private async clearSummaryHistory(): Promise<void> {
    try {
      await chrome.storage.local.set({ summaryHistory: [] });
      console.log("✅ Summary history cleared");
    } catch (error) {
      console.error("❌ Failed to clear summary history:", error);
      throw error;
    }
  }

  /**
   * 获取插件统计信息
   */
  async getStats(): Promise<any> {
    try {
      const history = await this.getSummaryHistory();
      const settings = await this.getSettings();

      return {
        success: true,
        stats: {
          totalSummaries: history.history?.length || 0,
          isConfigured: !!settings.settings?.apiKey,
          lastUsed: history.history?.[0]?.timestamp || null,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

// 自动初始化
TextSummaryBackground.getInstance();
