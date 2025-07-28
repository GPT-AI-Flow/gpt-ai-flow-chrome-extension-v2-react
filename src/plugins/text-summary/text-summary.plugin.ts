import {
  Plugin,
  PluginStatus,
  PluginInitializationContext,
  PluginConfig,
} from "../../core/interfaces/plugin.interface";
import {
  Feature,
  FeatureExecutionContext,
  FeatureExecutionResult,
} from "../../core/interfaces/feature.interface";
import { textSummaryFeature } from "./features/text-summary.feature";
import { ContextMenuManager } from "./context-menu-manager";

/**
 * 文本总结插件
 * 提供右键菜单文本总结功能
 */
export class TextSummaryPlugin implements Plugin {
  readonly id = "text-summary-plugin";
  readonly name = "文本总结插件";
  readonly version = "1.0.0";
  readonly description = "通过右键菜单提供选中文本的AI总结功能";
  readonly author = "GPT AI Flow";
  readonly features: Feature[] = [textSummaryFeature];

  status: PluginStatus = PluginStatus.UNLOADED;

  private contextMenuManager?: ContextMenuManager;
  private initContext?: PluginInitializationContext;
  private config: PluginConfig = {
    enabled: true,
    settings: {
      apiUrl: "https://api.example.com/summarize",
      apiKey: "",
      maxLength: 200,
      language: "zh-CN",
    },
    lastUpdated: new Date(),
  };

  /**
   * 初始化插件
   */
  async initialize(context: PluginInitializationContext): Promise<void> {
    console.log(`🚀 Initializing ${this.name}...`);

    this.initContext = context;

    // 加载插件配置
    await this.loadConfig();

    // 初始化右键菜单管理器
    this.contextMenuManager = new ContextMenuManager(this.config.settings);

    console.log(`✅ ${this.name} initialized`);
  }

  /**
   * 激活插件
   */
  async activate(): Promise<void> {
    if (!this.contextMenuManager) {
      throw new Error("Plugin not initialized");
    }

    console.log(`🔌 Activating ${this.name}...`);

    // 注册右键菜单
    await this.contextMenuManager.registerContextMenu();

    // 监听右键菜单点击事件
    this.contextMenuManager.onSummaryRequested((selectedText: string) => {
      this.handleSummaryRequest(selectedText);
    });

    console.log(`✅ ${this.name} activated`);
  }

  /**
   * 停用插件
   */
  async deactivate(): Promise<void> {
    console.log(`🔌 Deactivating ${this.name}...`);

    if (this.contextMenuManager) {
      await this.contextMenuManager.unregisterContextMenu();
    }

    console.log(`✅ ${this.name} deactivated`);
  }

  /**
   * 卸载插件
   */
  async dispose(): Promise<void> {
    console.log(`🧹 Disposing ${this.name}...`);

    await this.deactivate();
    this.contextMenuManager = undefined;
    this.initContext = undefined;

    console.log(`✅ ${this.name} disposed`);
  }

  /**
   * 获取插件配置
   */
  getConfig(): PluginConfig {
    return { ...this.config };
  }

  /**
   * 设置插件配置
   */
  async setConfig(config: Partial<PluginConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.config.lastUpdated = new Date();

    // 保存配置到存储
    if (this.initContext?.storage) {
      await this.initContext.storage.setItem(
        `plugin_config_${this.id}`,
        this.config
      );
    }

    // 更新右键菜单管理器配置
    if (this.contextMenuManager && config.settings) {
      this.contextMenuManager.updateSettings(config.settings);
    }
  }

  /**
   * 获取插件状态信息
   */
  getStatusInfo() {
    return {
      status: this.status,
      featuresCount: this.features.length,
      activeFeatures:
        this.status === PluginStatus.ACTIVE ? this.features.length : 0,
    };
  }

  /**
   * 加载插件配置
   */
  private async loadConfig(): Promise<void> {
    if (!this.initContext?.storage) return;

    try {
      const result = await this.initContext.storage.getItem(
        `plugin_config_${this.id}`,
        this.config
      );

      if (result.success && result.data) {
        this.config = { ...this.config, ...result.data };
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load config for ${this.name}:`, error);
    }
  }

  /**
   * 处理总结请求
   */
  private async handleSummaryRequest(selectedText: string): Promise<void> {
    if (!this.initContext) return;

    try {
      // 创建功能执行上下文
      const context: FeatureExecutionContext = {
        siteConfig: {
          id: "current-site",
          name: window.location.hostname,
          urlRules: [
            {
              pattern: window.location.href,
              type: "exact",
              include: true,
            },
          ],
          enabledFeatures: [
            {
              featureId: "text-summary",
              enabled: true,
              settings: this.config.settings,
            },
          ],
        },
        settings: this.config.settings,
        document: document,
        storage: this.initContext.storage,
        url: window.location.href,
      };

      // 添加选中的文本到设置中
      context.settings.selectedText = selectedText;

      // 执行文本总结功能
      const result = await textSummaryFeature.execute(context);

      if (result.success) {
        this.showSummaryResult(selectedText, result);
      } else {
        this.showError(result.error || "总结失败");
      }
    } catch (error) {
      console.error("❌ Summary request failed:", error);
      this.showError("总结请求失败");
    }
  }

  /**
   * 显示总结结果
   */
  private showSummaryResult(
    originalText: string,
    result: FeatureExecutionResult
  ): void {
    // 创建结果显示弹窗
    const modal = this.createResultModal(
      originalText,
      result.actions?.[0] || "总结完成"
    );
    document.body.appendChild(modal);

    // 3秒后自动关闭（可选）
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 10000);
  }

  /**
   * 显示错误信息
   */
  private showError(message: string): void {
    // 创建简单的错误提示
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    `;
    notification.textContent = `❌ ${message}`;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * 创建结果显示模态框
   */
  private createResultModal(
    originalText: string,
    summary: string
  ): HTMLElement {
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
    `;

    modal.innerHTML = `
      <div style="padding: 24px; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">📝 文本总结</h3>
        <button id="close-summary" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        ">×</button>
      </div>
      <div style="padding: 24px; max-height: 400px; overflow-y: auto;">
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #666; font-size: 14px;">原文：</h4>
          <div style="
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #007acc;
            font-size: 14px;
            line-height: 1.5;
            max-height: 120px;
            overflow-y: auto;
          ">${originalText}</div>
        </div>
        <div>
          <h4 style="margin: 0 0 8px 0; color: #666; font-size: 14px;">总结：</h4>
          <div style="
            background: #e8f5e8;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid #28a745;
            font-size: 14px;
            line-height: 1.5;
          ">${summary}</div>
        </div>
      </div>
    `;

    // 添加关闭事件
    const closeBtn = modal.querySelector("#close-summary");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      });
    }

    // 点击背景关闭
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
    `;

    overlay.addEventListener("click", () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });

    document.body.appendChild(overlay);
    return modal;
  }
}

// 导出插件实例
export default new TextSummaryPlugin();
