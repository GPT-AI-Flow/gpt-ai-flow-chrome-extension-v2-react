import { useEffect, useState } from "react";
import "./Popup.css";
import { TextSummaryPopup } from "../plugins/text-summary/popup-extension";

interface PluginStats {
  totalSummaries: number;
  isConfigured: boolean;
  lastUsed: string | null;
  todaySummaries: number;
  weekSummaries: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  count?: number;
}

export default function () {
  const [activeTab, setActiveTab] = useState("main");
  const [pluginStats, setPluginStats] = useState<PluginStats>({
    totalSummaries: 0,
    isConfigured: false,
    lastUsed: null,
    todaySummaries: 0,
    weekSummaries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Hello from the popup!");
    loadPluginStats();
  }, []);

  const loadPluginStats = async () => {
    try {
      setLoading(true);

      // 获取基本统计信息
      const statsResponse = await chrome.runtime.sendMessage({
        type: "GET_STATS",
      });

      // 获取历史记录用于计算今日和本周数据
      const historyResponse = await chrome.runtime.sendMessage({
        type: "GET_SUMMARY_HISTORY",
      });

      if (statsResponse?.success && historyResponse?.success) {
        const history = historyResponse.history || [];

        // 计算今日和本周的总结数量
        const today = new Date();
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const todaySummaries = history.filter(
          (item: any) => new Date(item.timestamp) >= startOfDay
        ).length;

        const weekSummaries = history.filter(
          (item: any) => new Date(item.timestamp) >= startOfWeek
        ).length;

        setPluginStats({
          totalSummaries: statsResponse.stats?.totalSummaries || 0,
          isConfigured: statsResponse.stats?.isConfigured || false,
          lastUsed: statsResponse.stats?.lastUsed || null,
          todaySummaries,
          weekSummaries,
        });
      }
    } catch (error) {
      console.error("Failed to load plugin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "configure",
      title: "配置总结",
      description: "设置AI API",
      icon: "⚙️",
      color: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      action: () => setActiveTab("summary"),
    },
    {
      id: "history",
      title: "查看历史",
      description: "总结记录",
      icon: "📚",
      color: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      action: () => setActiveTab("summary"),
      count: pluginStats.totalSummaries,
    },
    {
      id: "today",
      title: "今日总结",
      description: "今天使用次数",
      icon: "📊",
      color: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
      action: () => setActiveTab("summary"),
      count: pluginStats.todaySummaries,
    },
    {
      id: "help",
      title: "使用指南",
      description: "学习如何使用",
      icon: "💡",
      color: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
      action: () => {
        // 可以打开帮助页面或显示使用提示
      },
    },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "从未使用";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const getStatusColor = () => {
    if (!pluginStats.isConfigured) return "#ff9800";
    if (pluginStats.todaySummaries > 0) return "#4caf50";
    return "#2196f3";
  };

  const getStatusText = () => {
    if (!pluginStats.isConfigured) return "未配置";
    if (pluginStats.todaySummaries > 0) return "活跃中";
    return "已就绪";
  };

  return (
    <div
      style={{
        width: "420px",
        minHeight: "540px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
    >
      {/* 头部区域 */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "24px 20px 20px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-20%",
            width: "200px",
            height: "200px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <img
            src="/icon-with-shadow.svg"
            style={{
              width: "48px",
              height: "48px",
              marginBottom: "12px",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            GPT AI Flow
          </h1>
          <p
            style={{
              margin: "8px 0 16px 0",
              fontSize: "14px",
              opacity: 0.9,
              fontWeight: "400",
            }}
          >
            智能浏览器助手
          </p>

          {/* 状态指示器 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "20px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: getStatusColor(),
                boxShadow: `0 0 8px ${getStatusColor()}`,
              }}
            />
            <span>{getStatusText()}</span>
            {pluginStats.lastUsed && (
              <span style={{ opacity: 0.8 }}>
                • 最后使用: {formatDate(pluginStats.lastUsed)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div
        style={{
          padding: "16px 12px 12px 12px",
          background: "white",
          display: "flex",
          gap: "4px",
          borderRadius: "12px 12px 0 0",
          marginTop: "-8px",
          position: "relative",
          zIndex: 2,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}
      >
        {[
          { id: "main", label: "主页", icon: "🏠" },
          {
            id: "summary",
            label: "AI总结",
            icon: "📝",
            badge:
              pluginStats.totalSummaries > 0
                ? pluginStats.totalSummaries
                : undefined,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "14px 12px",
              border: "none",
              background:
                activeTab === tab.id
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "transparent",
              color: activeTab === tab.id ? "white" : "#666",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? "600" : "500",
              borderRadius: activeTab === tab.id ? "8px" : "0",
              margin: activeTab === tab.id ? "4px" : "0",
              transition: "all 0.2s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              transform: activeTab === tab.id ? "translateY(-1px)" : "none",
              boxShadow:
                activeTab === tab.id
                  ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                  : "none",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "18px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "#ff4444",
                  color: "white",
                  borderRadius: "10px",
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: "600",
                  minWidth: "16px",
                  textAlign: "center",
                }}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ background: "white", minHeight: "380px" }}>
        {activeTab === "main" && (
          <div
            style={{
              padding: "24px",
              background: "white",
            }}
          >
            {loading ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "#666" }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔄</div>
                <div>加载数据中...</div>
              </div>
            ) : (
              <>
                {/* 统计卡片 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "10px",
                      padding: "16px 12px",
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {pluginStats.totalSummaries}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.9 }}>总计</div>
                  </div>

                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      borderRadius: "10px",
                      padding: "16px 12px",
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {pluginStats.weekSummaries}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.9 }}>本周</div>
                  </div>

                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                      borderRadius: "10px",
                      padding: "16px 12px",
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "20px", fontWeight: "700" }}>
                      {pluginStats.todaySummaries}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.9 }}>今日</div>
                  </div>
                </div>

                {/* 快速操作 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "24px",
                  }}
                >
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      style={{
                        background: action.color,
                        border: "none",
                        borderRadius: "12px",
                        padding: "16px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#333",
                        transition: "transform 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        position: "relative",
                        minHeight: "80px",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{action.icon}</span>
                      <span>{action.title}</span>
                      <span style={{ fontSize: "10px", opacity: 0.8 }}>
                        {action.description}
                      </span>
                      {action.count !== undefined && (
                        <span
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: "700",
                          }}
                        >
                          {action.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 使用指南 */}
                <div
                  style={{
                    background: pluginStats.isConfigured
                      ? "#e8f5e8"
                      : "#fff3cd",
                    border: `1px solid ${
                      pluginStats.isConfigured ? "#d4edda" : "#ffeaa7"
                    }`,
                    borderRadius: "10px",
                    padding: "16px",
                    textAlign: "left",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: pluginStats.isConfigured ? "#28a745" : "#856404",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {pluginStats.isConfigured ? "✅ 使用指南" : "⚠️ 配置提醒"}
                  </h4>
                  {pluginStats.isConfigured ? (
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: "16px",
                        fontSize: "12px",
                        color: "#546e7a",
                        lineHeight: "1.6",
                      }}
                    >
                      <li>在网页上选择要总结的文本</li>
                      <li>右键选择"📝 AI总结选中文本"</li>
                      <li>等待AI生成智能总结</li>
                      <li>在"AI总结"标签查看历史记录</li>
                    </ol>
                  ) : (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#856404",
                        lineHeight: "1.6",
                      }}
                    >
                      <p style={{ margin: "0 0 8px 0" }}>
                        请先配置AI API以使用总结功能：
                      </p>
                      <p style={{ margin: 0 }}>
                        点击上方"配置总结"按钮开始设置
                      </p>
                    </div>
                  )}
                </div>

                {/* 版本信息 */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "16px 12px 0 12px",
                    fontSize: "11px",
                    color: "#9e9e9e",
                    borderTop: "1px solid #f0f0f0",
                    marginTop: "20px",
                  }}
                >
                  <p style={{ margin: 0 }}>Version 1.0.0 • React-TS</p>
                  <p style={{ margin: "4px 0 0 0" }}>Powered by GPT AI Flow</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "summary" && <TextSummaryPopup />}
      </div>
    </div>
  );
}
