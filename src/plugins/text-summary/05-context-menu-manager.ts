/**
 * 右键菜单管理器
 * 负责注册和管理Chrome扩展的右键菜单
 */
export class ContextMenuManager {
  private static readonly MENU_ID = "gpt-ai-flow-summary";
  private settings: Record<string, any>;

  constructor(settings: Record<string, any>) {
    this.settings = settings;
  }

  /**
   * 初始化（只支持Chrome扩展环境）
   */
  async initialize(): Promise<void> {
    await this.registerContextMenu();
  }

  /**
   * 注册右键菜单
   */
  async registerContextMenu(): Promise<void> {
    // 检查是否在Chrome扩展环境中
    if (typeof chrome === "undefined" || !chrome.contextMenus) {
      console.warn("⚠️ Chrome contextMenus API not available");
      return;
    }

    try {
      // 移除现有菜单（如果存在）
      await this.unregisterContextMenu();

      // 创建右键菜单
      await new Promise<void>((resolve, reject) => {
        chrome.contextMenus.create(
          {
            id: ContextMenuManager.MENU_ID,
            title: "📝 AI总结选中文本",
            contexts: ["selection"],
            documentUrlPatterns: ["http://*/*", "https://*/*"],
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          }
        );
      });

      // 添加点击事件监听器
      chrome.contextMenus.onClicked.addListener(
        this.handleMenuClick.bind(this)
      );

      console.log("✅ Context menu registered successfully");
    } catch (error) {
      console.error("❌ Failed to register context menu:", error);
      throw error;
    }
  }

  /**
   * 注销右键菜单
   */
  async unregisterContextMenu(): Promise<void> {
    if (typeof chrome === "undefined" || !chrome.contextMenus) {
      return;
    }

    try {
      await new Promise<void>((resolve) => {
        chrome.contextMenus.removeAll(() => {
          resolve();
        });
      });

      console.log("✅ Context menu unregistered");
    } catch (error) {
      console.warn("⚠️ Failed to unregister context menu:", error);
    }
  }

  /**
   * 处理右键菜单点击事件
   */
  private handleMenuClick(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ): void {
    if (info.menuItemId !== ContextMenuManager.MENU_ID) {
      return;
    }

    const selectedText = info.selectionText;
    if (!selectedText || selectedText.trim().length === 0) {
      console.warn("⚠️ No text selected");
      return;
    }

    console.log(
      `🎯 Summary requested for: "${selectedText.substring(0, 50)}..."`
    );

    // 发送消息到当前标签页
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "SUMMARY_REQUESTED",
        selectedText: selectedText,
      });
    }
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings: Record<string, any>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}
