import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  downloadCategoryDashboardReport,
  downloadStatusDashboardReport,
  getCategoryDashboard,
  getStatusDashboard,
  getTagDashboard,
} from "@/module_e/api/dashboardApi";

const STATUS_COLORS = {
  DRAFT: "#2563eb",
  PENDING_REVIEW: "#b91c1c",
  APPROVED: "#166534",
  REJECTED: "#a16207",
  UNPUBLISHED: "#7c3aed",
  ARCHIVED: "#374151",
};

function AdminDashboardPage() {
  const [statusDashboard, setStatusDashboard] = useState(null);
  const [categoryDashboard, setCategoryDashboard] = useState(null);
  const [tagDashboard, setTagDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState("summary");

  const summaryRef = useRef(null);
  const statusRef = useRef(null);
  const workflowRef = useRef(null);
  const categoryRef = useRef(null);
  const tagsRef = useRef(null);

  async function refreshDashboard() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [statusData, categoryData, tagData] = await Promise.all([
        getStatusDashboard(),
        getCategoryDashboard(),
        getTagDashboard(),
      ]);
      setStatusDashboard(statusData);
      setCategoryDashboard(categoryData);
      setTagDashboard(tagData);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboard();
  }, []);

  const workflowStages = statusDashboard?.workflow?.stages ?? [];
  const statusItems = statusDashboard?.items ?? [];
  const categoryItems = categoryDashboard?.items ?? [];
  const tagItems = tagDashboard?.items ?? [];

  const reviewAttention = statusDashboard?.workflow?.bottleneck_stage === "PENDING_REVIEW"
    ? `Pending Review (${statusDashboard.workflow.bottleneck_count})`
    : "No pending review backlog";

  const topCategory = useMemo(() => {
    if (categoryItems.length === 0) {
      return null;
    }
    return categoryItems.reduce((best, item) => (item.count > best.count ? item : best), categoryItems[0]);
  }, [categoryItems]);

  const topTag = useMemo(() => {
    const usedTags = tagItems.filter((item) => Number(item.approvedResourceCount ?? 0) > 0);
    if (usedTags.length === 0) {
      return null;
    }
    return usedTags[0];
  }, [tagItems]);

  async function handleDownload(type) {
    setErrorMessage("");
    setDownloading(type);
    try {
      if (type === "status") {
        await downloadStatusDashboardReport();
      } else {
        await downloadCategoryDashboardReport();
      }
    } catch (error) {
      setErrorMessage(error?.message || "Failed to download report.");
    } finally {
      setDownloading("");
    }
  }

  useEffect(() => {
    const sections = [
      { id: "summary", ref: summaryRef },
      { id: "status", ref: statusRef },
      { id: "workflow", ref: workflowRef },
      { id: "category", ref: categoryRef },
      { id: "tags", ref: tagsRef },
    ];

    const updateActiveSection = () => {
      let nextActive = "summary";
      for (const section of sections) {
        const element = section.ref.current;
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 140) {
          nextActive = section.id;
        }
      }
      setActiveSection(nextActive);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, []);

  function jumpToSection(sectionId) {
    const targetBySection = {
      summary: summaryRef,
      status: statusRef,
      workflow: workflowRef,
      category: categoryRef,
      tags: tagsRef,
    };
    const target = targetBySection[sectionId]?.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={styles.page}>
      <div style={styles.pageLayout}>
        <div style={styles.mainColumn}>
          <div style={styles.pageHeader}>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.title}>Reports</h1>
                <p style={styles.subtitle}>
                  Track resource status distribution, review attention, category coverage, and approved-resource tag
                  popularity.
                </p>
              </div>
              <button type="button" onClick={refreshDashboard} style={styles.primaryButton} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {errorMessage ? (
              <div role="alert" style={styles.errorBanner}>
                {errorMessage}
              </div>
            ) : null}
          </div>

          <section ref={summaryRef} style={styles.summaryGrid} aria-label="Reports summary">
            <SummaryCard label="Total Resources" value={statusDashboard?.total ?? 0} />
            <SummaryCard label="Review Attention" value={reviewAttention} highlight={statusDashboard?.workflow?.bottleneck_stage === "PENDING_REVIEW"} />
            <SummaryCard label="Top Category" value={topCategory ? `${topCategory.categoryName} (${topCategory.count})` : "No category data"} />
            <SummaryCard label="Top Tag" value={topTag ? `${topTag.tagName} (${topTag.approvedResourceCount})` : "No approved tag data"} />
          </section>

          <section style={styles.grid}>
            <div ref={statusRef} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>Status Dashboard</span>
                  <p style={styles.cardSubtitle}>
                    Distribution across all resource statuses. Pending Review is the review bottleneck when it has items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload("status")}
                  style={styles.secondaryButton}
                  disabled={loading || downloading === "status"}
                >
                  {downloading === "status" ? "Downloading..." : "Download CSV"}
                </button>
              </div>

              <div style={styles.chartArea}>
                <div style={styles.donutWrap}>
                  <div style={{ ...styles.donut, background: buildStatusDonut(statusItems) }}>
                    <div style={styles.donutCenter}>
                      <strong style={styles.donutValue}>{statusDashboard?.total ?? 0}</strong>
                      <span style={styles.donutLabel}>Resources</span>
                    </div>
                  </div>
                </div>
                <div style={styles.chartList}>
                  {statusItems.length === 0 ? (
                    <div style={styles.emptyPanel}>{loading ? "Loading..." : "No status data."}</div>
                  ) : (
                    statusItems.map((item) => (
                      <MetricBar
                        key={item.key}
                        label={item.label}
                        count={item.count}
                        ratio={item.ratio}
                        color={STATUS_COLORS[item.key] || "#4b5563"}
                        marker={item.bottleneck ? "Review Bottleneck" : item.workflow_stage ? "Workflow" : "Standard"}
                        highlight={item.bottleneck}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div ref={workflowRef} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>Workflow Status</span>
                  <p style={styles.cardSubtitle}>Resource review and management stages, separate from contributor applications.</p>
                </div>
              </div>

              <div style={styles.chartListCompact}>
                {workflowStages.length === 0 ? (
                  <div style={styles.emptyPanel}>{loading ? "Loading..." : "No workflow data."}</div>
                ) : (
                  workflowStages.map((stage) => (
                    <MetricBar
                      key={stage.key}
                      label={stage.label}
                      count={stage.count}
                      ratio={stage.ratio}
                      color={stage.bottleneck ? "#b91c1c" : "#2d6a4f"}
                      marker={stage.bottleneck ? "Review Bottleneck" : "Workflow"}
                      highlight={stage.bottleneck}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <section style={styles.grid}>
            <div ref={categoryRef} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>Category Dashboard</span>
                  <p style={styles.cardSubtitle}>Resource distribution across heritage categories.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload("category")}
                  style={styles.secondaryButton}
                  disabled={loading || downloading === "category"}
                >
                  {downloading === "category" ? "Downloading..." : "Download CSV"}
                </button>
              </div>

              <div style={styles.chartList}>
                {categoryItems.length === 0 ? (
                  <div style={styles.emptyPanel}>{loading ? "Loading..." : "No category data."}</div>
                ) : (
                  categoryItems.map((item) => (
                    <MetricBar
                      key={item.categoryId ?? item.categoryName}
                      label={item.categoryName}
                      count={item.count}
                      ratio={item.ratio}
                      color={item.categoryStatus === "ACTIVE" ? "#2d6a4f" : "#a16207"}
                      marker={item.categoryStatus}
                    />
                  ))
                )}
              </div>
            </div>

            <div ref={tagsRef} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <span style={styles.cardTitle}>Top Approved Tags</span>
                  <p style={styles.cardSubtitle}>Popularity based only on approved resources.</p>
                </div>
              </div>

              <div style={styles.chartListCompact}>
                {tagItems.filter((item) => Number(item.approvedResourceCount ?? 0) > 0).length === 0 ? (
                  <div style={styles.emptyPanel}>{loading ? "Loading..." : "No approved tag data."}</div>
                ) : (
                  tagItems
                    .filter((item) => Number(item.approvedResourceCount ?? 0) > 0)
                    .slice(0, 5)
                    .map((item) => (
                      <MetricBar
                        key={item.tagId}
                        label={item.tagName}
                        count={item.approvedResourceCount}
                        ratio={item.ratio}
                        color="#2d6a4f"
                        marker="Approved resources"
                      />
                    ))
                )}
              </div>
            </div>
          </section>
        </div>

        <aside style={styles.sectionNav}>
          <div style={styles.sectionNavTitle}>Quick Jump</div>
          <div style={styles.sectionNavList}>
            {[
              { id: "summary", label: "Summary" },
              { id: "status", label: "Status" },
              { id: "workflow", label: "Workflow" },
              { id: "category", label: "Category" },
              { id: "tags", label: "Tags" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToSection(item.id)}
                style={{
                  ...styles.sectionNavBtn,
                  ...(activeSection === item.id ? styles.sectionNavBtnActive : null),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight = false }) {
  return (
    <div style={{ ...styles.summaryCard, ...(highlight ? styles.summaryHighlight : null) }}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
    </div>
  );
}

function MetricBar({ label, count, ratio, color, marker, highlight = false }) {
  return (
    <div style={{ ...styles.metricItem, ...(highlight ? styles.metricHighlight : null) }}>
      <div style={styles.metricTop}>
        <span style={styles.metricLabel}>{label}</span>
        <span style={styles.metricCount}>{count}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${Math.min(Number(ratio ?? 0), 100)}%`, background: color }} />
      </div>
      <div style={styles.metricMeta}>
        <span>{formatRatio(ratio)}</span>
        <span>{marker}</span>
      </div>
    </div>
  );
}

function buildStatusDonut(items) {
  if (!items?.length) {
    return "#eef2f0";
  }

  let cursor = 0;
  const segments = items
    .filter((item) => Number(item.ratio ?? 0) > 0)
    .map((item) => {
      const start = cursor;
      const end = cursor + Number(item.ratio ?? 0);
      cursor = end;
      return `${STATUS_COLORS[item.key] || "#4b5563"} ${start}% ${end}%`;
    });

  if (segments.length === 0) {
    return "#eef2f0";
  }
  return `conic-gradient(${segments.join(", ")})`;
}

function formatRatio(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

const styles = {
  page: {
    width: "100%",
    padding: "36px 40px",
    minHeight: "calc(100vh - 58px)",
    background: "#f4f7f5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
    color: "#374151",
  },
  pageLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 170px",
    gap: 16,
    alignItems: "start",
  },
  mainColumn: {
    minWidth: 0,
  },
  sectionNav: {
    position: "sticky",
    top: 74,
    background: "#fff",
    border: "1px solid #e8e3dc",
    borderRadius: 8,
    padding: "12px 10px",
  },
  sectionNavTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 8,
    padding: "0 4px",
  },
  sectionNavList: {
    display: "grid",
    gap: 6,
  },
  sectionNavBtn: {
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#4b5563",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
  },
  sectionNavBtnActive: {
    background: "#f0fdf4",
    borderColor: "#bbf7d0",
    color: "#166534",
  },
  pageHeader: {
    marginBottom: 20,
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#1a2e1f",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 720,
  },
  primaryButton: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #2d6a4f",
    background: "#2d6a4f",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    lineHeight: 1.4,
  },
  secondaryButton: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #2d6a4f",
    background: "#fff",
    color: "#166534",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBanner: {
    marginTop: 12,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 1.5,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  summaryCard: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e8e3dc",
    padding: "16px 18px",
    display: "grid",
    gap: 8,
  },
  summaryHighlight: {
    borderColor: "#fca5a5",
    background: "#fff7f7",
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#1a2e1f",
    fontSize: 18,
    lineHeight: 1.25,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
    gap: 18,
    alignItems: "start",
    marginBottom: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e8e3dc",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 20px",
    borderBottom: "1px solid #f0ebe2",
    background: "#fafaf8",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
  },
  cardSubtitle: {
    margin: "5px 0 0",
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 1.5,
  },
  chartArea: {
    display: "grid",
    gridTemplateColumns: "180px minmax(0, 1fr)",
    gap: 18,
    padding: 18,
    alignItems: "center",
  },
  donutWrap: {
    display: "flex",
    justifyContent: "center",
  },
  donut: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
  },
  donutCenter: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "#fff",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    border: "1px solid #eef2f0",
  },
  donutValue: {
    color: "#1a2e1f",
    fontSize: 24,
    lineHeight: 1,
  },
  donutLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 5,
  },
  chartList: {
    display: "grid",
    gap: 10,
    padding: 16,
  },
  chartListCompact: {
    display: "grid",
    gap: 10,
    padding: 16,
  },
  metricItem: {
    border: "1px solid #f0ebe2",
    borderRadius: 8,
    padding: 12,
    background: "#fff",
  },
  metricHighlight: {
    borderColor: "#fca5a5",
    background: "#fff7f7",
  },
  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  metricLabel: {
    color: "#1a2e1f",
    fontSize: 13,
    fontWeight: 700,
  },
  metricCount: {
    color: "#374151",
    fontSize: 16,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    background: "#eef2f0",
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  metricMeta: {
    marginTop: 7,
    color: "#6b7280",
    fontSize: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  emptyPanel: {
    padding: 24,
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
  },
};

export default AdminDashboardPage;
