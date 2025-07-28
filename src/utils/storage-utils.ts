/**
 * 存储操作的结果类型
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 存储工具类，提供类型安全的存储操作
 */
export class StorageUtils {
  /**
   * 存储数据到本地存储
   * @param key 存储键
   * @param value 存储值
   * @returns 操作结果
   */
  async setItem<T = any>(key: string, value: T): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.set({ [key]: value });
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to set item '${key}': ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 从本地存储获取数据
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 操作结果
   */
  async getItem<T = any>(
    key: string,
    defaultValue?: T
  ): Promise<StorageResult<T>> {
    try {
      const result = await chrome.storage.local.get(key);
      const data = result[key] ?? defaultValue;
      return { success: true, data };
    } catch (error) {
      const errorMessage = `Failed to get item '${key}': ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage, data: defaultValue };
    }
  }

  /**
   * 从本地存储删除数据
   * @param key 存储键
   * @returns 操作结果
   */
  async removeItem(key: string): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.remove(key);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to remove item '${key}': ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 清空所有本地存储数据
   * @returns 操作结果
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to clear storage: ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 批量获取多个存储项
   * @param keys 存储键数组
   * @returns 操作结果
   */
  async getMultipleItems<T = any>(
    keys: string[]
  ): Promise<StorageResult<Record<string, T>>> {
    try {
      const result = await chrome.storage.local.get(keys);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = `Failed to get multiple items: ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 批量设置多个存储项
   * @param items 要存储的键值对
   * @returns 操作结果
   */
  async setMultipleItems(
    items: Record<string, any>
  ): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.set(items);
      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to set multiple items: ${error}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

// 导出单例实例，保持向后兼容
export const storageUtils = new StorageUtils();
