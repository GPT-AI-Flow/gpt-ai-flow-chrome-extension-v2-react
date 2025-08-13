import { Feature, FeatureImplementation } from "./interfaces/feature.interface";
import { SiteConfig, FeatureMapping } from "./interfaces/site-config.interface";

/**
 * 功能注册表项
 */
interface FeatureRegistryEntry {
  /** 功能基本信息 */
  feature: Feature;
  /** 注册时间 */
  registeredAt: Date;
  /** 注册来源插件 */
  pluginId?: string;
}

/**
 * 功能查询选项
 */
interface FeatureQueryOptions {
  /** 按标签过滤 */
  tags?: string[];
  /** 按作者过滤 */
  author?: string;
  /** 按URL过滤适用性 */
  url?: string;
  /** 是否只返回活跃功能 */
  activeOnly?: boolean;
}

/**
 * 功能注册表
 * 管理所有已注册的功能和它们的实现
 */
export class FeatureRegistry {
  /** 功能存储：功能ID -> 实现名称 -> 功能注册表项 */
  private features = new Map<string, Map<string, FeatureRegistryEntry>>();

  /** 默认实现映射：功能ID -> 默认实现名称 */
  private defaultImplementations = new Map<string, string>();

  /** 功能别名映射：别名 -> 功能ID */
  private aliases = new Map<string, string>();

  /**
   * 注册功能实现
   * @param feature 功能实例
   * @param pluginId 来源插件ID
   * @param isDefault 是否为默认实现
   */
  registerFeature(
    feature: Feature,
    pluginId?: string,
    isDefault: boolean = false
  ): void {
    const featureId = feature.id;
    const implementationName = this.getImplementationName(feature);

    // 确保功能ID存在
    if (!this.features.has(featureId)) {
      this.features.set(featureId, new Map());
    }

    const implementations = this.features.get(featureId)!;

    // 注册功能实现
    implementations.set(implementationName, {
      feature,
      registeredAt: new Date(),
      pluginId,
    });

    // 设置默认实现
    if (isDefault || !this.defaultImplementations.has(featureId)) {
      this.defaultImplementations.set(featureId, implementationName);
    }

    console.log(
      `✅ Feature registered: ${featureId}/${implementationName}` +
        (pluginId ? ` (from ${pluginId})` : "") +
        (isDefault ? " [DEFAULT]" : "")
    );
  }

  /**
   * 获取功能实现
   * @param featureId 功能ID
   * @param implementationName 实现名称，不指定则使用默认实现
   * @returns 功能实例或 undefined
   */
  getFeature(
    featureId: string,
    implementationName?: string
  ): Feature | undefined {
    // 处理别名
    const resolvedFeatureId = this.aliases.get(featureId) || featureId;

    const implementations = this.features.get(resolvedFeatureId);
    if (!implementations) {
      return undefined;
    }

    const implName =
      implementationName || this.defaultImplementations.get(resolvedFeatureId);
    if (!implName) {
      return undefined;
    }

    const entry = implementations.get(implName);
    return entry?.feature;
  }

  /**
   * 获取适用于特定网站的功能列表
   * @param siteConfig 网站配置
   * @param url 当前URL
   * @returns 适用的功能列表
   */
  getApplicableFeatures(siteConfig: SiteConfig, url: string): Feature[] {
    const applicableFeatures: Feature[] = [];

    // 按优先级排序功能映射
    const sortedMappings = [...siteConfig.enabledFeatures].sort(
      (a, b) => (a.priority || 999) - (b.priority || 999)
    );

    for (const mapping of sortedMappings) {
      if (!mapping.enabled) continue;

      const feature = this.getFeature(
        mapping.featureId,
        mapping.implementation
      );
      if (!feature) {
        console.warn(
          `⚠️ Feature not found: ${mapping.featureId}/${
            mapping.implementation || "default"
          }`
        );
        continue;
      }

      try {
        if (feature.isApplicable(url, siteConfig)) {
          applicableFeatures.push(feature);
        }
      } catch (error) {
        console.error(
          `❌ Error checking feature applicability: ${feature.id}`,
          error
        );
      }
    }

    return applicableFeatures;
  }

  /**
   * 查询功能
   * @param options 查询选项
   * @returns 匹配的功能列表
   */
  queryFeatures(options: FeatureQueryOptions = {}): Feature[] {
    const results: Feature[] = [];

    for (const [featureId, implementations] of this.features.entries()) {
      for (const [implName, entry] of implementations.entries()) {
        const feature = entry.feature;

        // 按标签过滤
        if (options.tags && options.tags.length > 0) {
          const featureTags = feature.tags || [];
          if (!options.tags.some((tag) => featureTags.indexOf(tag) !== -1)) {
            continue;
          }
        }

        // 按作者过滤
        if (options.author && feature.author !== options.author) {
          continue;
        }

        // 按URL过滤适用性
        if (options.url && !feature.isApplicable(options.url)) {
          continue;
        }

        // 按活跃状态过滤
        if (options.activeOnly) {
          const status = feature.getFeatureStatus?.();
          if (!status?.active) {
            continue;
          }
        }

        results.push(feature);
      }
    }

    return results;
  }

  /**
   * 获取所有功能的概览信息
   * @returns 功能概览列表
   */
  getAllFeatures(): Array<{
    featureId: string;
    name: string;
    description: string;
    implementations: Array<{
      name: string;
      isDefault: boolean;
      pluginId?: string;
    }>;
  }> {
    const result: Array<{
      featureId: string;
      name: string;
      description: string;
      implementations: Array<{
        name: string;
        isDefault: boolean;
        pluginId?: string;
      }>;
    }> = [];

    for (const [featureId, implementations] of this.features.entries()) {
      const defaultImpl = this.defaultImplementations.get(featureId);
      const firstFeature = implementations.values().next().value?.feature;

      if (!firstFeature) continue;

      const impls = [];
      for (const [implName, entry] of implementations.entries()) {
        impls.push({
          name: implName,
          isDefault: implName === defaultImpl,
          pluginId: entry.pluginId,
        });
      }

      result.push({
        featureId,
        name: firstFeature.name,
        description: firstFeature.description,
        implementations: impls,
      });
    }

    return result;
  }

  /**
   * 注销功能实现
   * @param featureId 功能ID
   * @param implementationName 实现名称，不指定则注销所有实现
   * @param pluginId 插件ID，只注销指定插件的功能
   */
  unregisterFeature(
    featureId: string,
    implementationName?: string,
    pluginId?: string
  ): boolean {
    const implementations = this.features.get(featureId);
    if (!implementations) {
      return false;
    }

    if (implementationName) {
      // 注销特定实现
      const entry = implementations.get(implementationName);
      if (!entry || (pluginId && entry.pluginId !== pluginId)) {
        return false;
      }

      implementations.delete(implementationName);

      // 如果删除的是默认实现，重新选择默认实现
      if (this.defaultImplementations.get(featureId) === implementationName) {
        const remainingImpls = Array.from(implementations.keys());
        if (remainingImpls.length > 0) {
          this.defaultImplementations.set(featureId, remainingImpls[0]);
        } else {
          this.defaultImplementations.delete(featureId);
        }
      }

      // 如果没有实现了，删除整个功能
      if (implementations.size === 0) {
        this.features.delete(featureId);
      }

      console.log(
        `🗑️ Feature unregistered: ${featureId}/${implementationName}`
      );
      return true;
    } else {
      // 注销所有实现（可选择性地只注销指定插件的）
      if (pluginId) {
        let removed = false;
        for (const [implName, entry] of implementations.entries()) {
          if (entry.pluginId === pluginId) {
            implementations.delete(implName);
            removed = true;
          }
        }

        if (implementations.size === 0) {
          this.features.delete(featureId);
          this.defaultImplementations.delete(featureId);
        }

        return removed;
      } else {
        // 注销所有实现
        this.features.delete(featureId);
        this.defaultImplementations.delete(featureId);
        console.log(
          `🗑️ All implementations unregistered for feature: ${featureId}`
        );
        return true;
      }
    }
  }

  /**
   * 为功能设置别名
   * @param alias 别名
   * @param featureId 功能ID
   */
  setAlias(alias: string, featureId: string): void {
    this.aliases.set(alias, featureId);
  }

  /**
   * 获取实现名称
   * @param feature 功能实例
   * @returns 实现名称
   */
  private getImplementationName(feature: Feature): string {
    if ("implementationName" in feature) {
      return (feature as FeatureImplementation).implementationName;
    }
    return "default";
  }

  /**
   * 清理所有功能（主要用于测试）
   */
  clear(): void {
    this.features.clear();
    this.defaultImplementations.clear();
    this.aliases.clear();
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats(): {
    totalFeatures: number;
    totalImplementations: number;
    pluginBreakdown: Record<string, number>;
  } {
    let totalImplementations = 0;
    const pluginBreakdown: Record<string, number> = {};

    for (const implementations of this.features.values()) {
      totalImplementations += implementations.size;

      for (const entry of implementations.values()) {
        const pluginId = entry.pluginId || "unknown";
        pluginBreakdown[pluginId] = (pluginBreakdown[pluginId] || 0) + 1;
      }
    }

    return {
      totalFeatures: this.features.size,
      totalImplementations,
      pluginBreakdown,
    };
  }
}

// 导出单例实例
export const featureRegistry_default = new FeatureRegistry();

/**
 * 便捷的功能注册函数
 * @param feature 功能实例
 * @param pluginId 插件ID
 * @param isDefault 是否为默认实现
 */
export function registerFeature(
  feature: Feature,
  pluginId?: string,
  isDefault?: boolean
): void {
  featureRegistry_default.registerFeature(feature, pluginId, isDefault);
}
