import {
  Plugin,
  PluginStatus,
  PluginInitializationContext,
} from "./interfaces/plugin.interface";
import {
  Feature,
  FeatureExecutionContext,
  FeatureExecutionResult,
} from "./interfaces/feature.interface";
import { SiteConfig } from "./interfaces/site-config.interface";
import {
  featureRegistry as defaultFeatureRegistry,
  FeatureRegistry,
} from "./feature-registry";
import { StorageUtils } from "../utils/storage-utils";

/**
 * 插件执行结果
 */
interface PluginExecutionResult {
  pluginId: string;
  success: boolean;
  executedFeatures: Array<{
    featureId: string;
    implementation: string;
    result: FeatureExecutionResult;
  }>;
  errors: string[];
}

/**
 * 插件管理器
 * 负责插件的生命周期管理和功能执行协调
 */
export class PluginManager {
  /** 已加载的插件 */
  private plugins = new Map<string, Plugin>();

  /** 功能注册表 */
  private featureRegistry: FeatureRegistry;

  /** 存储工具 */
  private storage: StorageUtils;

  /** 是否已初始化 */
  private isInitialized = false;

  /** 初始化上下文 */
  private initContext: PluginInitializationContext;

  constructor(
    featureRegistry: FeatureRegistry = defaultFeatureRegistry,
    storage: StorageUtils = new StorageUtils()
  ) {
    this.featureRegistry = featureRegistry;
    this.storage = storage;
    this.initContext = {
      storage: this.storage,
      messaging: typeof chrome !== "undefined" ? chrome.runtime : null,
      settings: {},
      pluginManager: this,
    };
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("🔄 PluginManager already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing PluginManager...");

      // 加载全局设置
      await this.loadGlobalSettings();

      // 自动发现并加载插件
      await this.discoverAndLoadPlugins();

      this.isInitialized = true;
      console.log("✅ PluginManager initialized successfully");
      console.log(
        `📊 Stats: ${this.plugins.size} plugins, ${
          this.featureRegistry.getStats().totalFeatures
        } features`
      );
    } catch (error) {
      console.error("❌ Failed to initialize PluginManager:", error);
      throw error;
    }
  }

  /**
   * 加载全局设置
   */
  private async loadGlobalSettings(): Promise<void> {
    const result = await this.storage.getItem("globalSettings", {});
    if (result.success && result.data) {
      this.initContext.settings = result.data;
    }
  }

  /**
   * 自动发现并加载插件
   */
  private async discoverAndLoadPlugins(): Promise<void> {
    const pluginModules = [
      { path: "../plugins/feature-a", name: "feature-a-plugin" },
      { path: "../plugins/feature-b", name: "feature-b-plugin" },
    ];

    const loadPromises = pluginModules.map(async ({ path, name }) => {
      try {
        const module = await import(path);
        const plugin = module.default || module[name];

        if (plugin && this.isValidPlugin(plugin)) {
          await this.loadPlugin(plugin);
        } else {
          console.warn(`⚠️ Invalid plugin structure in ${path}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load plugin from ${path}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * 验证插件结构
   */
  private isValidPlugin(plugin: any): plugin is Plugin {
    return (
      plugin &&
      typeof plugin.id === "string" &&
      typeof plugin.name === "string" &&
      typeof plugin.version === "string" &&
      typeof plugin.initialize === "function" &&
      Array.isArray(plugin.features)
    );
  }

  /**
   * 加载单个插件
   * @param plugin 插件实例
   */
  async loadPlugin(plugin: Plugin): Promise<void> {
    try {
      console.log(`🔌 Loading plugin: ${plugin.name} (${plugin.id})`);

      // 检查是否已加载
      if (this.plugins.has(plugin.id)) {
        console.warn(`⚠️ Plugin ${plugin.id} is already loaded`);
        return;
      }

      // 设置状态为加载中
      plugin.status = PluginStatus.LOADING;

      // 初始化插件
      await plugin.initialize(this.initContext);

      // 注册插件的所有功能
      this.registerPluginFeatures(plugin);

      // 激活插件（如果支持）
      if (plugin.activate) {
        await plugin.activate();
        plugin.status = PluginStatus.ACTIVE;
      } else {
        plugin.status = PluginStatus.LOADED;
      }

      // 保存插件
      this.plugins.set(plugin.id, plugin);

      console.log(`✅ Plugin loaded successfully: ${plugin.name}`);
      console.log(`   📦 Registered ${plugin.features.length} features`);
    } catch (error) {
      plugin.status = PluginStatus.ERROR;
      console.error(`❌ Failed to load plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * 注册插件的功能
   * @param plugin 插件实例
   */
  private registerPluginFeatures(plugin: Plugin): void {
    plugin.features.forEach((feature, index) => {
      try {
        const isDefault = index === 0; // 第一个功能作为默认实现
        this.featureRegistry.registerFeature(feature, plugin.id, isDefault);
      } catch (error) {
        console.error(`❌ Failed to register feature ${feature.id}:`, error);
      }
    });
  }

  /**
   * 注销插件的功能
   * @param pluginId 插件ID
   */
  private unregisterPluginFeatures(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    plugin.features.forEach((feature) => {
      try {
        this.featureRegistry.unregisterFeature(feature.id, undefined, pluginId);
      } catch (error) {
        console.error(`❌ Failed to unregister feature ${feature.id}:`, error);
      }
    });
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`⚠️ Plugin ${pluginId} not found`);
      return;
    }

    try {
      console.log(`🔌 Unloading plugin: ${plugin.name}`);

      // 停用插件
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      // 注销功能
      this.unregisterPluginFeatures(pluginId);

      // 清理资源
      if (plugin.dispose) {
        await plugin.dispose();
      }

      plugin.status = PluginStatus.UNLOADED;
      this.plugins.delete(pluginId);

      console.log(`✅ Plugin unloaded: ${plugin.name}`);
    } catch (error) {
      console.error(`❌ Failed to unload plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * 执行适用于当前网站的所有功能
   * @param siteConfig 网站配置
   * @param url 当前URL
   * @returns 执行结果
   */
  async executeApplicableFeatures(
    siteConfig: SiteConfig,
    url: string
  ): Promise<PluginExecutionResult[]> {
    if (!this.isInitialized) {
      throw new Error("PluginManager not initialized");
    }

    console.log(`🎯 Executing features for: ${siteConfig.name} (${url})`);

    const applicableFeatures = this.featureRegistry.getApplicableFeatures(
      siteConfig,
      url
    );
    console.log(`📋 Found ${applicableFeatures.length} applicable features`);

    const results: PluginExecutionResult[] = [];
    const pluginResults = new Map<string, PluginExecutionResult>();

    // 按插件分组执行功能
    for (const feature of applicableFeatures) {
      const pluginId = this.getFeaturePluginId(feature);

      if (!pluginResults.has(pluginId)) {
        pluginResults.set(pluginId, {
          pluginId,
          success: true,
          executedFeatures: [],
          errors: [],
        });
      }

      const pluginResult = pluginResults.get(pluginId)!;

      try {
        const context: FeatureExecutionContext = {
          siteConfig,
          settings: this.getFeatureSettings(siteConfig, feature.id),
          document,
          storage: this.storage,
          url,
        };

        console.log(`🔧 Executing feature: ${feature.name} (${feature.id})`);
        const result = await feature.execute(context);

        pluginResult.executedFeatures.push({
          featureId: feature.id,
          implementation: this.getFeatureImplementationName(feature),
          result,
        });

        if (!result.success) {
          pluginResult.success = false;
          pluginResult.errors.push(result.error || "Unknown error");
        }

        console.log(
          `${result.success ? "✅" : "❌"} Feature ${feature.name}: ${
            result.success ? "success" : result.error
          }`
        );
      } catch (error) {
        const errorMessage = `Feature execution failed: ${error}`;
        console.error(`❌ ${errorMessage}`);

        pluginResult.success = false;
        pluginResult.errors.push(errorMessage);
        pluginResult.executedFeatures.push({
          featureId: feature.id,
          implementation: this.getFeatureImplementationName(feature),
          result: { success: false, error: errorMessage },
        });
      }
    }

    return Array.from(pluginResults.values());
  }

  /**
   * 执行特定功能
   * @param featureId 功能ID
   * @param implementation 实现名称
   * @param context 执行上下文
   * @returns 执行结果
   */
  async executeFeature(
    featureId: string,
    implementation: string | undefined,
    context: FeatureExecutionContext
  ): Promise<FeatureExecutionResult> {
    const feature = this.featureRegistry.getFeature(featureId, implementation);
    if (!feature) {
      const error = `Feature not found: ${featureId}/${
        implementation || "default"
      }`;
      console.warn(`⚠️ ${error}`);
      return { success: false, error };
    }

    try {
      console.log(`🔧 Executing feature: ${feature.name}`);
      const result = await feature.execute(context);
      console.log(
        `${result.success ? "✅" : "❌"} Feature execution result:`,
        result
      );
      return result;
    } catch (error) {
      const errorMessage = `Feature execution failed: ${error}`;
      console.error(`❌ ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取插件信息
   * @param pluginId 插件ID
   * @returns 插件实例
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   * @returns 所有插件列表
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件状态
   * @returns 插件状态摘要
   */
  getPluginStatus(): Array<{
    id: string;
    name: string;
    status: PluginStatus;
    featuresCount: number;
    version: string;
  }> {
    return Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      status: plugin.status,
      featuresCount: plugin.features.length,
      version: plugin.version,
    }));
  }

  /**
   * 获取功能所属的插件ID
   * @param feature 功能实例
   * @returns 插件ID
   */
  private getFeaturePluginId(feature: Feature): string {
    // 这里可以通过功能注册表获取更准确的插件ID
    // 临时实现：从插件列表中查找
    for (const [pluginId, plugin] of this.plugins.entries()) {
      if (plugin.features.some((f) => f.id === feature.id)) {
        return pluginId;
      }
    }
    return "unknown";
  }

  /**
   * 获取功能的设置
   * @param siteConfig 网站配置
   * @param featureId 功能ID
   * @returns 功能设置
   */
  private getFeatureSettings(
    siteConfig: SiteConfig,
    featureId: string
  ): Record<string, any> {
    const mapping = siteConfig.enabledFeatures.find(
      (m) => m.featureId === featureId
    );
    return mapping?.settings || {};
  }

  /**
   * 获取功能实现名称
   * @param feature 功能实例
   * @returns 实现名称
   */
  private getFeatureImplementationName(feature: Feature): string {
    if ("implementationName" in feature) {
      return (feature as any).implementationName;
    }
    return "default";
  }

  /**
   * 清理所有资源
   */
  async dispose(): Promise<void> {
    console.log("🧹 Disposing PluginManager...");

    const unloadPromises = Array.from(this.plugins.keys()).map((pluginId) =>
      this.unloadPlugin(pluginId)
    );

    await Promise.all(unloadPromises);

    this.featureRegistry.clear();
    this.isInitialized = false;

    console.log("✅ PluginManager disposed");
  }
}
