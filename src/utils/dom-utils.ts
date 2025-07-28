/**
 * DOM 操作的结果类型
 */
export interface DOMOperationResult<T = HTMLElement> {
  success: boolean;
  element?: T;
  error?: string;
}

/**
 * DOM 工具类，提供安全的 DOM 操作方法
 */
export class DOMUtils {
  /**
   * 安全地获取单个元素
   * @param selector CSS 选择器
   * @param context 查找上下文，默认为 document
   * @returns 查找结果
   */
  static querySelector<T extends HTMLElement = HTMLElement>(
    selector: string,
    context: Document | HTMLElement = document
  ): DOMOperationResult<T> {
    try {
      const element = context.querySelector<T>(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
        };
      }
      return { success: true, element };
    } catch (error) {
      return {
        success: false,
        error: `Invalid selector: ${selector}, ${error}`,
      };
    }
  }

  /**
   * 安全地获取多个元素
   * @param selector CSS 选择器
   * @param context 查找上下文，默认为 document
   * @returns 查找结果
   */
  static querySelectorAll<T extends HTMLElement = HTMLElement>(
    selector: string,
    context: Document | HTMLElement = document
  ): DOMOperationResult<T[]> {
    try {
      const elements = Array.from(context.querySelectorAll<T>(selector));
      return { success: true, element: elements };
    } catch (error) {
      return {
        success: false,
        error: `Invalid selector: ${selector}, ${error}`,
      };
    }
  }

  /**
   * 创建元素并设置属性
   * @param tagName 标签名
   * @param options 元素配置选项
   * @returns 创建的元素
   */
  static createElement<T extends HTMLElement = HTMLElement>(
    tagName: string,
    options: {
      attributes?: Record<string, string>;
      styles?: Partial<CSSStyleDeclaration>;
      textContent?: string;
      innerHTML?: string;
      className?: string;
    } = {}
  ): DOMOperationResult<T> {
    try {
      const element = document.createElement(tagName) as T;

      // 设置属性
      if (options.attributes) {
        Object.keys(options.attributes).forEach((key: string) => {
          element.setAttribute(key, options.attributes![key]);
        });
      }

      // 设置样式
      if (options.styles) {
        Object.assign(element.style, options.styles);
      }

      // 设置类名
      if (options.className) {
        element.className = options.className;
      }

      // 设置文本内容
      if (options.textContent) {
        element.textContent = options.textContent;
      }

      // 设置 HTML 内容
      if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
      }

      return { success: true, element };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create element: ${tagName}, ${error}`,
      };
    }
  }

  /**
   * 安全地添加子元素
   * @param parent 父元素
   * @param child 子元素
   * @returns 操作结果
   */
  static appendChild(
    parent: HTMLElement,
    child: HTMLElement
  ): DOMOperationResult<void> {
    try {
      parent.appendChild(child);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to append child: ${error}`,
      };
    }
  }

  /**
   * 安全地移除元素
   * @param element 要移除的元素
   * @returns 操作结果
   */
  static removeElement(element: HTMLElement): DOMOperationResult<void> {
    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      } else {
        element.remove();
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove element: ${error}`,
      };
    }
  }

  /**
   * 等待元素出现
   * @param selector CSS 选择器
   * @param timeout 超时时间（毫秒）
   * @param context 查找上下文
   * @returns Promise，解析为元素或超时
   */
  static waitForElement<T extends HTMLElement = HTMLElement>(
    selector: string,
    timeout: number = 5000,
    context: Document | HTMLElement = document
  ): Promise<DOMOperationResult<T>> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkElement = () => {
        const result = this.querySelector<T>(selector, context);

        if (result.success) {
          resolve(result);
          return;
        }

        if (Date.now() - startTime >= timeout) {
          resolve({
            success: false,
            error: `Element not found within timeout: ${selector}`,
          });
          return;
        }

        requestAnimationFrame(checkElement);
      };

      checkElement();
    });
  }

  /**
   * 观察元素变化
   * @param element 要观察的元素
   * @param callback 变化回调
   * @param options 观察选项
   * @returns MutationObserver 实例
   */
  static observeElement(
    element: HTMLElement,
    callback: (mutations: MutationRecord[]) => void,
    options: MutationObserverInit = { childList: true, subtree: true }
  ): MutationObserver {
    const observer = new MutationObserver(callback);
    observer.observe(element, options);
    return observer;
  }

  /**
   * 检查元素是否在视口中
   * @param element 要检查的元素
   * @returns 是否在视口中
   */
  static isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

// 为了向后兼容，导出原有的函数
export const getElementBySelector = (selector: string) =>
  DOMUtils.querySelector(selector).element;

export const createElement = (
  tag: string,
  attributes: Record<string, string> = {}
) => DOMUtils.createElement(tag, { attributes }).element!;

export const appendChild = (parent: HTMLElement, child: HTMLElement) =>
  DOMUtils.appendChild(parent, child);

export const removeElement = (element: HTMLElement) =>
  DOMUtils.removeElement(element);

export const setElementText = (element: HTMLElement, text: string) => {
  element.textContent = text;
};

export const setElementStyle = (
  element: HTMLElement,
  styles: Record<string, string>
) => {
  Object.assign(element.style, styles);
};
