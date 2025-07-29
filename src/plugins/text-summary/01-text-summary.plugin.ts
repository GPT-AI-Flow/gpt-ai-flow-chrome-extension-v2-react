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
import { textSummaryFeature } from "./features/02-text-summary.feature";
import { ContextMenuManager } from "./05-context-menu-manager";

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
    await this.contextMenuManager.initialize();

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
   * 处理总结请求（不显示UI）
   */
  private async handleSummaryRequest(
    selectedText: string
  ): Promise<FeatureExecutionResult> {
    if (!this.initContext) {
      return {
        success: false,
        error: "插件未初始化",
      };
    }

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
        // 不在这里显示结果，而是返回给调用者
        console.log("✅ Summary completed successfully");
        return result;
      } else {
        this.showError(result.error || "总结失败");
        return result;
      }
    } catch (error) {
      console.error("❌ Summary request failed:", error);
      this.showError("总结请求失败");
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 显示错误信息 (简化版本)
   */
  private showError(message: string): void {
    // 简化的错误提示，避免UI冲突
    console.error("❌ Plugin Error:", message);
  }
}

// 导出插件实例
export default new TextSummaryPlugin();
