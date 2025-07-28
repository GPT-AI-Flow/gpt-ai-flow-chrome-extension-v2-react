import { Feature } from "./feature.interface";

/**
 * 插件初始化上下文
 */
export interface PluginInitializationContext {
  /** 存储工具 */
  storage: any;
  /** 消息传递 */
  messaging: any;
  /** 全局设置 */
  settings: Record<string, any>;
  /** 插件管理器引用 */
  pluginManager: any;
}

/**
 * 插件状态
 */
export enum PluginStatus {
  UNLOADED = "unloaded",
  LOADING = "loading",
  LOADED = "loaded",
  ACTIVE = "active",
  INACTIVE = "inactive",
  ERROR = "error",
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 是否启用插件 */
  enabled: boolean;
  /** 插件特定设置 */
  settings: Record<string, any>;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 插件接口
 * 定义了插件的基本结构和生命周期
 */
export interface Plugin {
  /** 插件唯一标识符 */
  readonly id: string;

  /** 插件名称 */
  readonly name: string;

  /** 插件版本 */
  readonly version: string;

  /** 插件描述 */
  readonly description: string;

  /** 插件作者 */
  readonly author?: string;

  /** 插件主页 */
  readonly homepage?: string;

  /** 插件依赖 */
  readonly dependencies?: string[];

  /** 插件提供的功能列表 */
  readonly features: Feature[];

  /** 当前状态 */
  status: PluginStatus;

  /**
   * 初始化插件
   * @param context 初始化上下文
   * @returns 初始化结果
   */
  initialize(context: PluginInitializationContext): Promise<void>;

  /**
   * 激活插件
   * @returns 激活结果
   */
  activate?(): Promise<void>;

  /**
   * 停用插件
   * @returns 停用结果
   */
  deactivate?(): Promise<void>;

  /**
   * 卸载插件，清理所有资源
   * @returns 卸载结果
   */
  dispose?(): Promise<void>;

  /**
   * 获取插件配置
   * @returns 当前配置
   */
  getConfig?(): PluginConfig;

  /**
   * 设置插件配置
   * @param config 新配置
   */
  setConfig?(config: Partial<PluginConfig>): Promise<void>;

  /**
   * 获取插件状态信息
   * @returns 状态信息
   */
  getStatusInfo?(): {
    status: PluginStatus;
    loadTime?: Date;
    lastError?: string;
    featuresCount: number;
    activeFeatures: number;
  };
}
