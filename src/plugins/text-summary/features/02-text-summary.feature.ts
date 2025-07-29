import {
  Feature,
  FeatureExecutionContext,
  FeatureExecutionResult,
} from "../../../core/interfaces/feature.interface";

/**
 * 文本总结API响应接口
 */
interface SummaryApiResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * 文本总结功能实现
 */
export class TextSummaryFeature implements Feature {
  readonly id = "text-summary";
  readonly name = "文本总结";
  readonly description = "使用AI对选中的文本进行智能总结";
  readonly version = "1.0.0";
  readonly author = "GPT AI Flow";
  readonly tags = ["ai", "text", "summary", "nlp"];

  /**
   * 检查该功能是否适用于指定的网站
   */
  isApplicable(url: string, siteConfig?: any): boolean {
    // 文本总结功能适用于所有网站
    return true;
  }

  /**
   * 检查功能是否适用于当前环境
   */
  async canExecute(context: FeatureExecutionContext): Promise<boolean> {
    // 检查是否有选中的文本
    const selectedText = context.settings.selectedText;
    if (!selectedText || selectedText.trim().length === 0) {
      return false;
    }

    // 检查文本长度（至少10个字符才值得总结）
    if (selectedText.trim().length < 10) {
      return false;
    }

    // 检查是否配置了API
    const apiUrl = context.settings.apiUrl;
    if (!apiUrl) {
      return false;
    }

    return true;
  }

  /**
   * 执行文本总结功能
   */
  async execute(
    context: FeatureExecutionContext
  ): Promise<FeatureExecutionResult> {
    try {
      console.log("🔍 Executing text summary feature...");
      console.log(`🔍 context: ${context}`);

      // 检查是否可以执行
      const canRun = await this.canExecute(context);
      if (!canRun) {
        return {
          success: false,
          error: "无法执行总结：缺少选中文本或API配置",
        };
      }

      const selectedText = context.settings.selectedText;
      const apiUrl = context.settings.apiUrl;
      const apiKey = context.settings.apiKey;
      const maxLength = context.settings.maxLength || 200;
      const language = context.settings.language || "zh-CN";

      console.log(
        `🔍 Starting text summary for ${selectedText.length} characters`
      );

      // 调用总结API
      // const summary = await this.callSummaryAPI({
      //   text: selectedText,
      //   apiUrl,
      //   apiKey,
      //   maxLength,
      //   language,
      // });
      const summary = "这是AI生成的总结内容..."; // @Dev

      // 保存总结历史（可选）
      await this.saveSummaryHistory(context, selectedText, summary);

      return {
        success: true,
        actions: [summary],
      };
    } catch (error) {
      console.error("❌ Text summary failed:", error);
      return {
        success: false,
        error: `总结失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  /**
   * 调用总结API
   * @Test
   */
  // private async callSummaryAPI(params: {
  //   text: string;
  //   apiUrl: string;
  //   apiKey?: string;
  //   maxLength: number;
  //   language: string;
  // }): Promise<string> {
  //   const { text, apiUrl, apiKey, maxLength, language } = params;

  //   // 构建请求数据
  //   const requestData = {
  //     text: text,
  //     max_length: maxLength,
  //     language: language,
  //     timestamp: Date.now(),
  //   };

  //   // 构建请求选项
  //   const requestOptions: RequestInit = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
  //     },
  //     body: JSON.stringify(requestData),
  //   };

  //   try {
  //     console.log(`📡 Calling summary API: ${apiUrl}`);

  //     const response = await fetch(apiUrl, requestOptions);

  //     if (!response.ok) {
  //       throw new Error(
  //         `API request failed: ${response.status} ${response.statusText}`
  //       );
  //     }

  //     const data: SummaryApiResponse = await response.json();

  //     if (!data.success) {
  //       throw new Error(data.error || "API返回失败状态");
  //     }

  //     if (!data.summary) {
  //       throw new Error("API未返回总结内容");
  //     }

  //     console.log(`✅ Summary received: ${data.summary.length} characters`);
  //     return data.summary;
  //   } catch (error) {
  //     // 如果API调用失败，使用本地简单总结逻辑作为备用
  //     console.warn("⚠️ API call failed, using fallback summary:", error);
  //     return this.generateFallbackSummary(text, maxLength);
  //   }
  // }

  /**
   * 生成备用总结（当API不可用时）
   * @Test
   */
  // private generateFallbackSummary(text: string, maxLength: number): string {
  //   // 简单的文本截取和处理逻辑
  //   const sentences = text
  //     .split(/[。！？.!?]/)
  //     .filter((s) => s.trim().length > 0);

  //   if (sentences.length === 0) {
  //     return (
  //       text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
  //     );
  //   }

  //   // 取前几句话作为总结
  //   let summary = "";
  //   for (const sentence of sentences) {
  //     if (summary.length + sentence.length > maxLength) {
  //       break;
  //     }
  //     summary += sentence.trim() + "。";
  //   }

  //   if (summary.length === 0) {
  //     summary = sentences[0].substring(0, maxLength - 3) + "...";
  //   }

  //   return `[本地总结] ${summary}`;
  // }

  /**
   * 保存总结历史
   */
  private async saveSummaryHistory(
    context: FeatureExecutionContext,
    originalText: string,
    summary: string
  ): Promise<void> {
    try {
      if (!context.storage) return;

      const historyKey = "text_summary_history";
      const historyResult = await context.storage.getItem(historyKey, []);
      const history = historyResult.success ? historyResult.data : [];

      // 添加新的总结记录
      const newRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        url: context.url,
        originalText: originalText.substring(0, 500), // 限制原文长度
        summary: summary,
      };

      history.unshift(newRecord);

      // 限制历史记录数量（最多保留50条）
      if (history.length > 50) {
        history.splice(50);
      }

      // 保存历史记录
      await context.storage.setItem(historyKey, history);

      console.log(
        `📚 Saved summary to history (${history.length} total records)`
      );
    } catch (error) {
      console.warn("⚠️ Failed to save summary history:", error);
    }
  }

  /**
   * 获取总结历史
   */
  async getSummaryHistory(storage: any): Promise<any[]> {
    try {
      const result = await storage.getItem("text_summary_history", []);
      return result.success ? result.data : [];
    } catch (error) {
      console.warn("⚠️ Failed to get summary history:", error);
      return [];
    }
  }

  /**
   * 清理资源
   */
  async dispose(): Promise<void> {
    console.log("🧹 Text summary feature disposed");
  }

  /**
   * 获取功能状态
   */
  getStatus() {
    return {
      active: true,
      lastExecuted: new Date(),
      executionCount: 0, // 这里可以实现计数逻辑
    };
  }
}

// 导出功能实例
export const textSummaryFeature = new TextSummaryFeature();
