/**
 * 右键菜单管理器
 * 负责注册和管理Chrome扩展的右键菜单
 */
export class ContextMenuManager {
  private static readonly MENU_ID = "gpt-ai-flow-summary";
  private settings: Record<string, any>;
  private onSummaryCallback?: (selectedText: string) => void;

  constructor(settings: Record<string, any>) {
    this.settings = settings;
    // ❌ 移除消息监听器，ContextMenuManager只负责菜单管理
    // this.setupMessageListener();
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
   * 设置总结请求回调（废弃）
   * @deprecated 不再需要回调，消息直接发送给content script处理
   */
  onSummaryRequested(callback: (selectedText: string) => void): void {
    console.warn("⚠️ onSummaryRequested is deprecated. Messages are sent directly to content script.");
    this.onSummaryCallback = callback;
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings: Record<string, any>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * 在非扩展环境中的备用方案
   * 创建一个浮动的"总结"按钮，当用户选择文本时显示
   */
  private setupFallbackContextMenu(): void {
    let summaryButton: HTMLElement | null = null;

    const showSummaryButton = (selection: Selection, selectedText: string) => {
      // 移除现有按钮
      if (summaryButton) {
        summaryButton.remove();
      }

      // 获取选择范围
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 创建总结按钮
      summaryButton = document.createElement("button");
      summaryButton.innerHTML = "📝 AI总结";
      summaryButton.style.cssText = `
        position: fixed;
        top: ${rect.bottom + window.scrollY + 5}px;
        left: ${rect.left + window.scrollX}px;
        background: #007acc;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;

      // 添加点击事件
      summaryButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.onSummaryCallback) {
          this.onSummaryCallback(selectedText);
        }

        if (summaryButton) {
          summaryButton.remove();
          summaryButton = null;
        }
      });

      // 添加到页面
      document.body.appendChild(summaryButton);

      // 3秒后自动隐藏
      setTimeout(() => {
        if (summaryButton) {
          summaryButton.remove();
          summaryButton = null;
        }
      }, 3000);
    };

    // 监听文本选择事件
    document.addEventListener("mouseup", () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const selectedText = selection.toString().trim();
        if (selectedText.length > 10) {
          showSummaryButton(selection, selectedText);
        }
      }
    });

    // 点击其他地方时隐藏按钮
    document.addEventListener("click", (e) => {
      if (summaryButton && !summaryButton.contains(e.target as Node)) {
        summaryButton.remove();
        summaryButton = null;
      }
    });

    console.log("✅ Fallback context menu setup completed");
  }

  /**
   * 初始化（根据环境选择合适的方案）
   */
  async initialize(): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.contextMenus) {
      // Chrome扩展环境
      await this.registerContextMenu();
    } else {
      // 非扩展环境，使用备用方案
      this.setupFallbackContextMenu();
    }
  }
}
