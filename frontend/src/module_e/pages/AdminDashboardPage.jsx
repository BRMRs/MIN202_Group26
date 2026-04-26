import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  downloadCategoryDashboardReport,
  downloadStatusDashboardReport,
  getCategoryDashboard,
  getContributorDashboard,
  getStatusDashboard,
  getTagDashboard,
} from "@/module_e/api/dashboardApi";

const STATUS_COLORS = {
  DRAFT: "#BFDFD2",
  PENDING_REVIEW: "#51999F",
  APPROVED: "#7BC0CD",
  REJECTED: "#FAA26F",
  UNPUBLISHED: "#FDCD94",
  ARCHIVED: "#FEE199",
};

const OVERVIEW_CONTRIBUTOR_LIMIT = 5;
const OVERVIEW_TAG_LIMIT = 10;

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "status", label: "Status Dashboard" },
  { id: "category", label: "Category Distribution" },
  { id: "contributor", label: "Contributor Activity" },
  { id: "tags", label: "Tag Popularity" },
];

function AdminDashboardPage() {
  const [statusDashboard, setStatusDashboard] = useState(null);
  const [categoryDashboard, setCategoryDashboard] = useState(null);
  const [tagDashboard, setTagDashboard] = useState(null);
  const [contributorDashboard, setContributorDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activePanel, setActivePanel] = useState("overview");
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllContributors, setShowAllContributors] = useState(false);
  const refreshingRef = useRef(false);

  async function refreshDashboard(options = {}) {
    const silent = options.silent === true;
    if (refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    if (!silent) {
      setLoading(true);
    }
    setErrorMessage("");
    try {
      const [statusData, categoryData, tagData, contributorData] = await Promise.all([
        getStatusDashboard(),
        getCategoryDashboard(),
        getTagDashboard(),
        getContributorDashboard(),
      ]);
      setStatusDashboard(statusData);
      setCategoryDashboard(categoryData);
      setTagDashboard(tagData);
      setContributorDashboard(contributorData);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to load report data.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
      refreshingRef.current = false;
    }
  }

  useEffect(() => {
    refreshDashboard();
    const timer = setInterval(() => {
      refreshDashboard({ silent: true });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const statusItems = useMemo(() => {
    const rows = (statusDashboard?.items ?? []).filter((item) => item?.key !== "DRAFT");
    const total = rows.reduce((sum, item) => sum + Number(item.count ?? 0), 0);
    if (total <= 0) {
      return rows;
    }
    return rows.map((item) => ({
      ...item,
      ratio: Math.round((Number(item.count ?? 0) * 10000) / total) / 100,
    }));
  }, [statusDashboard]);

  const statusTotal = useMemo(
    () => statusItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0),
    [statusItems]
  );

  const categoryItems = categoryDashboard?.items ?? [];
  const tagItems = tagDashboard?.items ?? [];
  const contributorItems = contributorDashboard?.items ?? [];

  const approvedTagItems = useMemo(
    () => tagItems.filter((item) => Number(item.approvedResourceCount ?? 0) > 0),
    [tagItems]
  );
  const overviewTagItems = useMemo(() => approvedTagItems.slice(0, OVERVIEW_TAG_LIMIT), [approvedTagItems]);
  const visibleTagItems = showAllTags ? approvedTagItems : approvedTagItems.slice(0, OVERVIEW_TAG_LIMIT);
  const canExpandTags = approvedTagItems.length > OVERVIEW_TAG_LIMIT;

  const overviewContributorItems = useMemo(
    () => contributorItems.slice(0, OVERVIEW_CONTRIBUTOR_LIMIT),
    [contributorItems]
  );
  const visibleContributorItems = showAllContributors
    ? contributorItems
    : contributorItems.slice(0, OVERVIEW_CONTRIBUTOR_LIMIT);
  const canExpandContributors = contributorItems.length > OVERVIEW_CONTRIBUTOR_LIMIT;

  const pendingReviewItem = statusItems.find((item) => item.key === "PENDING_REVIEW");
  const topCategory = categoryItems[0] ?? null;
  const topTag = approvedTagItems[0] ?? null;
  const topContributor = contributorItems[0] ?? null;

  useEffect(() => {
    setShowAllTags(false);
  }, [approvedTagItems.length]);

  useEffect(() => {
    setShowAllContributors(false);
  }, [contributorItems.length]);

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

  return (
    <div style={styles.page}>
      <div style={styles.pageLayout}>
        <aside style={styles.sectionNav}>
          <div style={styles.sectionNavTitle}>Reports Menu</div>
          <div style={styles.sectionNavList}>
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePanel(item.id)}
                style={{
                  ...styles.sectionNavBtn,
                  ...(activePanel === item.id ? styles.sectionNavBtnActive : null),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <div style={styles.mainColumn}>
          <div style={styles.pageHeader}>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.title}>Reports</h1>
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

          {activePanel === "overview" ? (
            <>
              <section style={styles.summaryGrid} aria-label="Reports summary">
                <SummaryCard
                  label="Pending Review"
                  value={pendingReviewItem ? `${pendingReviewItem.count}` : "0"}
                  helper={pendingReviewItem ? `${formatRatio(pendingReviewItem.ratio)} of visible statuses` : "No pending resources"}
                  highlight={Boolean(pendingReviewItem?.count)}
                />
                <SummaryCard
                  label="Top Category"
                  value={topCategory ? `${topCategory.categoryName} (${topCategory.count})` : "No category data"}
                />
                <SummaryCard
                  label="Top Contributor"
                  value={topContributor ? `${topContributor.contributorName} (${topContributor.count})` : "No contributor data"}
                />
                <SummaryCard
                  label="Top Tag"
                  value={topTag ? `${topTag.tagName} (${topTag.approvedResourceCount})` : "No approved tag data"}
                />
              </section>

              <section style={styles.grid}>
                <SectionCard
                  title="Status Dashboard"
                  subtitle="Donut chart with exact counts and ratio for each visible status."
                  action={
                    <button
                      type="button"
                      onClick={() => handleDownload("status")}
                      style={styles.secondaryButton}
                      disabled={loading || downloading === "status"}
                    >
                      {downloading === "status" ? "Downloading..." : "Download CSV"}
                    </button>
                  }
                >
                  <StatusChartBlock items={statusItems} total={statusTotal} loading={loading} />
                </SectionCard>

                <SectionCard
                  title="Contributor Activity"
                  subtitle={`Top ${OVERVIEW_CONTRIBUTOR_LIMIT} contributors by submitted resources.`}
                >
                  <div style={styles.chartListCompact}>
                    {overviewContributorItems.length === 0 ? (
                      <div style={styles.emptyPanel}>{loading ? "Loading..." : "No contributor data."}</div>
                    ) : (
                      overviewContributorItems.map((item) => (
                        <MetricBar
                          key={item.contributorId ?? item.contributorName}
                          label={item.contributorName}
                          count={item.count}
                          ratio={item.ratio}
                          color="#1f7a5c"
                          marker="Submitted resources"
                        />
                      ))
                    )}
                  </div>
                </SectionCard>
              </section>

              <section style={styles.singleSection}>
                <SectionCard
                  title="Category Distribution"
                  subtitle="Bar chart with exact resource counts for each category."
                  action={
                    <button
                      type="button"
                      onClick={() => handleDownload("category")}
                      style={styles.secondaryButton}
                      disabled={loading || downloading === "category"}
                    >
                      {downloading === "category" ? "Downloading..." : "Download CSV"}
                    </button>
                  }
                >
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
                          color="#2d6a4f"
                          marker={item.categoryStatus}
                        />
                      ))
                    )}
                  </div>
                </SectionCard>
              </section>

              <section style={styles.singleSection}>
                <SectionCard
                  title="Tag Popularity"
                  subtitle={`Bar chart for approved-resource tag usage (showing ${overviewTagItems.length} / ${approvedTagItems.length}).`}
                >
                  <div style={styles.chartListCompact}>
                    {overviewTagItems.length === 0 ? (
                      <div style={styles.emptyPanel}>{loading ? "Loading..." : "No approved tag data."}</div>
                    ) : (
                      overviewTagItems.map((item) => (
                        <MetricBar
                          key={item.tagId}
                          label={item.tagName}
                          count={item.approvedResourceCount}
                          ratio={item.ratio}
                          color="#2563eb"
                          marker="Approved resources"
                        />
                      ))
                    )}
                  </div>
                </SectionCard>
              </section>
            </>
          ) : null}

          {activePanel === "status" ? (
            <section style={styles.singleSection}>
              <SectionCard
                title="Status Dashboard"
                subtitle="Status donut and list view with explicit quantity and percentage."
                action={
                  <button
                    type="button"
                    onClick={() => handleDownload("status")}
                    style={styles.secondaryButton}
                    disabled={loading || downloading === "status"}
                  >
                    {downloading === "status" ? "Downloading..." : "Download CSV"}
                  </button>
                }
              >
                <StatusChartBlock items={statusItems} total={statusTotal} loading={loading} />
              </SectionCard>
            </section>
          ) : null}

          {activePanel === "category" ? (
            <section style={styles.singleSection}>
              <SectionCard
                title="Category Distribution"
                subtitle="Full category list with bar chart and exact resource count."
                action={
                  <button
                    type="button"
                    onClick={() => handleDownload("category")}
                    style={styles.secondaryButton}
                    disabled={loading || downloading === "category"}
                  >
                    {downloading === "category" ? "Downloading..." : "Download CSV"}
                  </button>
                }
              >
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
                        color="#2d6a4f"
                        marker={item.categoryStatus}
                      />
                    ))
                  )}
                </div>
              </SectionCard>
            </section>
          ) : null}

          {activePanel === "contributor" ? (
            <section style={styles.singleSection}>
              <SectionCard
                title="Contributor Activity"
                subtitle={`Sorted by submitted resources. Showing ${visibleContributorItems.length} / ${contributorItems.length}.`}
                action={
                  <button
                    type="button"
                    onClick={() => setShowAllContributors((previous) => !previous)}
                    style={styles.secondaryButton}
                    disabled={!canExpandContributors}
                  >
                    {showAllContributors ? `Show top ${OVERVIEW_CONTRIBUTOR_LIMIT}` : "Show all"}
                  </button>
                }
              >
                <div style={styles.chartListCompact}>
                  {visibleContributorItems.length === 0 ? (
                    <div style={styles.emptyPanel}>{loading ? "Loading..." : "No contributor data."}</div>
                  ) : (
                    visibleContributorItems.map((item) => (
                      <MetricBar
                        key={item.contributorId ?? item.contributorName}
                        label={item.contributorName}
                        count={item.count}
                        ratio={item.ratio}
                        color="#1f7a5c"
                        marker="Submitted resources"
                      />
                    ))
                  )}
                </div>
              </SectionCard>
            </section>
          ) : null}

          {activePanel === "tags" ? (
            <section style={styles.singleSection}>
              <SectionCard
                title="Tag Popularity"
                subtitle={`Approved-resource popularity. Showing ${visibleTagItems.length} / ${approvedTagItems.length}.`}
                action={
                  <button
                    type="button"
                    onClick={() => setShowAllTags((previous) => !previous)}
                    style={styles.secondaryButton}
                    disabled={!canExpandTags}
                  >
                    {showAllTags ? `Show top ${OVERVIEW_TAG_LIMIT}` : "Show all"}
                  </button>
                }
              >
                <div style={styles.chartListCompact}>
                  {visibleTagItems.length === 0 ? (
                    <div style={styles.emptyPanel}>{loading ? "Loading..." : "No approved tag data."}</div>
                  ) : (
                    visibleTagItems.map((item) => (
                      <MetricBar
                        key={item.tagId}
                        label={item.tagName}
                        count={item.approvedResourceCount}
                        ratio={item.ratio}
                        color="#2563eb"
                        marker="Approved resources"
                      />
                    ))
                  )}
                </div>
              </SectionCard>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatusChartBlock({ items, total, loading }) {
  if (!items.length) {
    return <div style={styles.emptyPanel}>{loading ? "Loading..." : "No status data."}</div>;
  }

  return (
    <div style={styles.chartArea}>
      <div style={styles.donutWrap}>
        <div style={{ ...styles.donut, background: buildStatusDonut(items) }}>
          <div style={styles.donutCenter}>
            <strong style={styles.donutValue}>{total}</strong>
            <span style={styles.donutLabel}>Resources</span>
          </div>
        </div>
      </div>
      <div style={styles.chartList}>
        {items.map((item) => (
          <MetricBar
            key={item.key}
            label={item.label}
            count={item.count}
            ratio={item.ratio}
            color={STATUS_COLORS[item.key] || "#4b5563"}
            marker={item.bottleneck ? "Review Bottleneck" : "Status"}
            highlight={item.bottleneck}
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, action, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.cardTitle}>{title}</span>
          <p style={styles.cardSubtitle}>{subtitle}</p>
        </div>
        {action || null}
      </div>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, helper = "", highlight = false }) {
  return (
    <div style={{ ...styles.summaryCard, ...(highlight ? styles.summaryHighlight : null) }}>
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
      {helper ? <span style={styles.summaryHelper}>{helper}</span> : null}
    </div>
  );
}

function MetricBar({ label, count, ratio, color, marker, highlight = false }) {
  return (
    <div style={{ ...styles.metricItem, ...(highlight ? styles.metricHighlight : null) }}>
      <div style={styles.metricTop}>
        <span style={styles.metricLabel} title={label}>{label}</span>
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
    gridTemplateColumns: "220px minmax(0, 1fr)",
    gap: 18,
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
    borderRadius: 10,
    padding: "14px 12px",
  },
  sectionNavTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 10,
    padding: "0 6px",
  },
  sectionNavList: {
    display: "grid",
    gap: 8,
  },
  sectionNavBtn: {
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#4b5563",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
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
    maxWidth: 760,
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
  summaryHelper: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 1.4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
    marginBottom: 18,
  },
  singleSection: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
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
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  metricCount: {
    color: "#374151",
    fontSize: 16,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
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
