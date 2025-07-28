/**
 * 功能映射配置
 */
export interface FeatureMapping {
  /** 功能标识符 */
  featureId: string;

  /** 功能实现名称（可选，默认使用 'default'） */
  implementation?: string;

  /** 是否启用该功能 */
  enabled: boolean;

  /** 功能特定设置 */
  settings?: Record<string, any>;

  /** 优先级（数字越小优先级越高） */
  priority?: number;
}

/**
 * URL 匹配规则
 */
export interface UrlMatchRule {
  /** 匹配模式（支持通配符和正则表达式） */
  pattern: string;

  /** 匹配类型 */
  type: "glob" | "regex" | "exact";

  /** 是否包含匹配（true）还是排除匹配（false） */
  include: boolean;
}

/**
 * 网站配置接口
 */
export interface SiteConfig {
  /** 配置唯一标识符 */
  readonly id: string;

  /** 网站名称 */
  readonly name: string;

  /** 网站描述 */
  readonly description?: string;

  /** URL 匹配规则列表 */
  urlRules: UrlMatchRule[];

  /** 该网站启用的功能列表 */
  enabledFeatures: FeatureMapping[];

  /** 网站特定设置 */
  settings?: Record<string, any>;

  /** 配置优先级（数字越小优先级越高） */
  priority?: number;

  /** 是否启用该配置 */
  enabled?: boolean;

  /** 配置创建时间 */
  createdAt?: Date;

  /** 配置最后修改时间 */
  updatedAt?: Date;
}

/**
 * 站点配置管理器接口
 */
export interface SiteConfigManager {
  /**
   * 根据 URL 获取匹配的网站配置
   * @param url 当前页面 URL
   * @returns 匹配的配置，如果没有匹配则返回默认配置
   */
  getConfigForUrl(url: string): SiteConfig;

  /**
   * 添加新的网站配置
   * @param config 网站配置
   */
  addSiteConfig(config: SiteConfig): void;

  /**
   * 更新网站配置
   * @param id 配置 ID
   * @param config 更新的配置
   */
  updateSiteConfig(id: string, config: Partial<SiteConfig>): void;

  /**
   * 删除网站配置
   * @param id 配置 ID
   */
  removeSiteConfig(id: string): void;

  /**
   * 获取所有网站配置
   * @returns 所有配置列表
   */
  getAllConfigs(): SiteConfig[];
}
