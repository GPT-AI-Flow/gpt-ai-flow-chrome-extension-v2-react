/**
 * 功能执行上下文
 */
export interface FeatureExecutionContext {
  /** 当前网站配置 */
  siteConfig: SiteConfig;
  /** 功能特定设置 for Feature */
  settings: Record<string, any>;
  /** DOM 文档对象 */
  document: Document;
  /** 存储工具 */
  storage: any;
  /** 当前页面 URL */
  url: string;
}

/**
 * 功能执行结果
 */
export interface FeatureExecutionResult {
  /** 是否执行成功 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
  /** 执行的操作描述 */
  actions?: string[];
}

/**
 * 功能接口
 * 定义了一个功能的基本结构和行为
 */
export interface Feature {
  /** 功能唯一标识符 */
  readonly id: string;

  /** 功能显示名称 */
  readonly name: string;

  /** 功能描述 */
  readonly description: string;

  /** 功能版本 */
  readonly version: string;

  /** 功能作者 */
  readonly author?: string;

  /** 功能标签，用于分类 */
  readonly tags?: string[];

  /**
   * 检查该功能是否适用于指定的网站
   * @param url 网站 URL
   * @param siteConfig 网站配置
   * @returns 是否适用
   */
  isApplicable(url: string, siteConfig?: SiteConfig): boolean;

  /**
   * 执行功能
   * @param context 执行上下文
   * @returns 执行结果
   */
  execute(context: FeatureExecutionContext): Promise<FeatureExecutionResult>;

  /**
   * 配置功能（可选）
   * @param config 配置对象
   */
  // configure?(config: Record<string, any>): void;

  /**
   * 获取功能的默认配置（可选）
   * @returns 默认配置
   */
  // getDefaultConfig?(): Record<string, any>;

  /**
   * 清理资源（可选）
   * 在功能被禁用或插件卸载时调用
   */
  // dispose?(): Promise<void>;

  /**
   * 获取功能状态（可选）
   * @returns 当前状态信息
   */
  getFeatureStatus?(): {
    active: boolean;
    lastExecuted?: Date;
    executionCount?: number;
  };
}

/**
 * 功能实现接口
 * 用于同一功能的不同实现方式
 */
export interface FeatureImplementation extends Feature {
  /** 实现名称（如 'default', 'github', 'stackoverflow' 等） */
  readonly implementationName: string;

  /** 该实现针对的特定网站或环境 */
  readonly targetSites?: string[];
}

// 导入 SiteConfig 类型
import { SiteConfig } from "./site-config.interface";
