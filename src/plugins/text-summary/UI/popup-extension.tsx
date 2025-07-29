import React, { useState, useEffect } from "react";

interface SummarySettings {
  apiUrl: string;
  apiKey: string;
  maxLength: number;
  language: string;
}

interface SummaryStats {
  totalSummaries: number;
  isConfigured: boolean;
  lastUsed: string | null;
}

interface SummaryHistoryItem {
  id: number;
  timestamp: string;
  url: string;
  originalText: string;
  summary: string;
}

export const TextSummaryPopup: React.FC = () => {
  const [settings, setSettings] = useState<SummarySettings>({
    apiUrl: "",
    apiKey: "",
    maxLength: 200,
    language: "zh-CN",
  });

  const [stats, setStats] = useState<SummaryStats>({
    totalSummaries: 0,
    isConfigured: false,
    lastUsed: null,
  });

  const [history, setHistory] = useState<SummaryHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"settings" | "history" | "stats">(
    "settings"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 加载设置
      const settingsResponse = await chrome.runtime.sendMessage({
        type: "GET_SETTINGS",
      });
      if (settingsResponse.success) {
        setSettings(settingsResponse.settings);
      }

      // 加载统计信息
      const statsResponse = await chrome.runtime.sendMessage({
        type: "GET_STATS",
      });
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      // 加载历史记录
      const historyResponse = await chrome.runtime.sendMessage({
        type: "GET_SUMMARY_HISTORY",
      });
      if (historyResponse.success) {
        setHistory(historyResponse.history || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      showMessage("加载数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      await chrome.runtime.sendMessage({
        type: "UPDATE_SETTINGS",
        settings: settings,
      });

      showMessage("设置已保存", "success");
      await loadData(); // 重新加载数据
    } catch (error) {
      console.error("Failed to save settings:", error);
      showMessage("保存设置失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm("确定要清空所有总结历史吗？")) {
      return;
    }

    try {
      setLoading(true);

      await chrome.runtime.sendMessage({ type: "CLEAR_SUMMARY_HISTORY" });

      setHistory([]);
      showMessage("历史记录已清空", "success");
      await loadData();
    } catch (error) {
      console.error("Failed to clear history:", error);
      showMessage("清空历史失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <div
      style={{ width: "400px", minHeight: "500px", fontFamily: "system-ui" }}
    >
      {/* 头部 */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px" }}>📝 AI文本总结</h2>
        <p style={{ margin: "8px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
          智能总结选中文本
        </p>
      </div>

      {/* 导航标签 */}
      <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
        {[
          { key: "settings", label: "⚙️ 设置", count: null },
          { key: "history", label: "📚 历史", count: history.length },
          { key: "stats", label: "📊 统计", count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: "12px 8px",
              border: "none",
              background: activeTab === tab.key ? "#f8f9fa" : "white",
              color: activeTab === tab.key ? "#007acc" : "#666",
              borderBottom:
                activeTab === tab.key ? "2px solid #007acc" : "none",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span
                style={{
                  marginLeft: "4px",
                  background: "#007acc",
                  color: "white",
                  borderRadius: "10px",
                  padding: "2px 6px",
                  fontSize: "10px",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          style={{
            padding: "8px 16px",
            background: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            fontSize: "12px",
            borderBottom: "1px solid #eee",
          }}
        >
          {message.text}
        </div>
      )}

      {/* 内容区域 */}
      <div style={{ padding: "16px", maxHeight: "400px", overflowY: "auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            🔄 加载中...
          </div>
        )}

        {!loading && activeTab === "settings" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                API 端点:
              </label>
              <input
                type="text"
                value={settings.apiUrl}
                onChange={(e) =>
                  setSettings({ ...settings, apiUrl: e.target.value })
                }
                placeholder="https://api.openai.com/v1/chat/completions"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                API 密钥:
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                placeholder="输入你的API密钥"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                最大长度:
              </label>
              <input
                type="number"
                value={settings.maxLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxLength: parseInt(e.target.value) || 200,
                  })
                }
                min="50"
                max="1000"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                语言:
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              >
                <option value="zh-CN">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <button
              onClick={saveSettings}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                background: "#007acc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              💾 保存设置
            </button>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#f8f9fa",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#666",
              }}
            >
              💡 使用方法：
              <br />
              1. 在任意网页选择文本
              <br />
              2. 右键选择"📝 AI总结选中文本"
              <br />
              3. 等待AI总结结果显示
            </div>
          </div>
        )}

        {!loading && activeTab === "history" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "14px" }}>总结历史</h4>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: "4px 8px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "10px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ 清空
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "20px",
                  fontSize: "12px",
                }}
              >
                📝 暂无总结历史
                <br />
                <span style={{ fontSize: "10px" }}>
                  开始使用右键总结功能吧！
                </span>
              </div>
            ) : (
              <div>
                {history.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "6px",
                      padding: "12px",
                      marginBottom: "8px",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ color: "#666", marginBottom: "4px" }}>
                      🌐 {new URL(item.url).hostname} •{" "}
                      {formatDate(item.timestamp)}
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      <strong>原文:</strong>{" "}
                      {truncateText(item.originalText, 80)}
                    </div>
                    <div style={{ color: "#007acc" }}>
                      <strong>总结:</strong> {truncateText(item.summary, 80)}
                    </div>
                  </div>
                ))}
                {history.length > 10 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#666",
                      fontSize: "10px",
                    }}
                  >
                    还有 {history.length - 10} 条记录...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "stats" && (
          <div>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "14px" }}>使用统计</h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  background: "#e8f5e8",
                  padding: "12px",
                  borderRadius: "6px",
                  textAlign: "center",
                  border: "1px solid #d4edda",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#28a745",
                  }}
                >
                  {stats.totalSummaries}
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>总结次数</div>
              </div>

              <div
                style={{
                  background: stats.isConfigured ? "#e8f5e8" : "#fff3cd",
                  padding: "12px",
                  borderRadius: "6px",
                  textAlign: "center",
                  border: `1px solid ${
                    stats.isConfigured ? "#d4edda" : "#ffeaa7"
                  }`,
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    color: stats.isConfigured ? "#28a745" : "#856404",
                  }}
                >
                  {stats.isConfigured ? "✅" : "⚠️"}
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>
                  {stats.isConfigured ? "已配置" : "未配置"}
                </div>
              </div>
            </div>

            {stats.lastUsed && (
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "#666",
                  marginBottom: "16px",
                }}
              >
                🕐 最后使用: {formatDate(stats.lastUsed)}
              </div>
            )}

            <div
              style={{
                background: "#e3f2fd",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "11px",
                border: "1px solid #bbdefb",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "8px",
                  color: "#1976d2",
                }}
              >
                💡 提示
              </div>
              <ul style={{ margin: 0, paddingLeft: "16px", color: "#666" }}>
                <li>总结历史自动保存到本地</li>
                <li>最多保留50条历史记录</li>
                <li>支持复制和导出总结结果</li>
                <li>可配置不同的AI模型</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
