import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/module_e/components";
import { listCategories } from "@/module_e/api/categoryApi";
import {
  archiveAdminResource,
  getAdminResourceDetail,
  listAdminResources,
  republishAdminResource,
  unpublishAdminResource,
  updateAdminResourceCategory,
} from "@/module_e/api/resourceAdminApi";

const STATUS_OPTIONS = {
  APPROVED: [
    { key: "unpublish", label: "Unpublish" },
    { key: "archive", label: "Archive" },
  ],
  UNPUBLISHED: [
    { key: "republish", label: "Republish" },
    { key: "archive", label: "Archive" },
  ],
};

const STATUS_ORDER = ["APPROVED", "UNPUBLISHED", "ARCHIVED", "PENDING_REVIEW", "REJECTED", "DRAFT"];

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function formatTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function normalizeMedia(item) {
  return {
    id: item?.id ?? null,
    mediaType: String(item?.mediaType ?? "FILE").toUpperCase(),
    fileUrl: item?.fileUrl ?? "",
    fileName: item?.fileName ?? "",
    fileSize: item?.fileSize ?? null,
    mimeType: item?.mimeType ?? "",
    sortOrder: item?.sortOrder ?? 0,
    uploadedAt: item?.uploadedAt ?? null,
  };
}

function normalizeResource(row) {
  return {
    id: row?.id ?? null,
    title: row?.title ?? "Untitled",
    description: row?.description ?? "",
    contributorId: row?.contributorId ?? null,
    categoryId: row?.categoryId ?? null,
    categoryName: row?.categoryName ?? "Unassigned",
    categoryStatus: row?.categoryStatus ?? "INACTIVE",
    status: normalizeStatus(row?.status || "DRAFT"),
    tags: Array.isArray(row?.tags) ? row.tags : [],
    archiveReason: row?.archiveReason ?? "",
    place: row?.place ?? "",
    externalLink: row?.externalLink ?? "",
    copyrightDeclaration: row?.copyrightDeclaration ?? "",
    createdAt: row?.createdAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    media: Array.isArray(row?.media) ? row.media.map(normalizeMedia) : [],
  };
}

function mediaKind(media) {
  const type = String(media?.mediaType ?? "").toUpperCase();
  const mimeType = String(media?.mimeType ?? "").toLowerCase();
  const url = String(media?.fileUrl ?? "");
  if (type === "VIDEO" || mimeType.startsWith("video/")) return "video";
  if (type === "AUDIO" || mimeType.startsWith("audio/")) return "audio";
  if (type === "COVER" || type === "DETAIL" || mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(url)) return "image";
  return "file";
}

function statusActions(status) {
  return STATUS_OPTIONS[normalizeStatus(status)] ?? [];
}

function statusBadge(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "APPROVED") return styles.badgeOk;
  if (normalized === "UNPUBLISHED") return styles.badgeWarn;
  if (normalized === "ARCHIVED") return styles.badgeDanger;
  return styles.badgeMuted;
}

function categoryBadge(status) {
  return status === "ACTIVE" ? styles.badgeCatActive : styles.badgeCatInactive;
}

function ResourceManagementPage() {
  const [resources, setResources] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [openStatusMenuFor, setOpenStatusMenuFor] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailResource, setDetailResource] = useState(null);
  const [detailError, setDetailError] = useState("");

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveReason, setArchiveReason] = useState("");

  const [republishOpen, setRepublishOpen] = useState(false);
  const [republishTarget, setRepublishTarget] = useState(null);
  const [republishCategoryId, setRepublishCategoryId] = useState("");

  const [changeCategoryOpen, setChangeCategoryOpen] = useState(false);
  const [changeCategoryTarget, setChangeCategoryTarget] = useState(null);
  const [nextCategoryId, setNextCategoryId] = useState("");

  async function refreshAll() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [resourceRows, categoryRows] = await Promise.all([listAdminResources(), listCategories()]);
      const normalizedResources = (resourceRows ?? []).map(normalizeResource);
      const categories = Array.isArray(categoryRows) ? categoryRows : [];
      const active = categories.filter((item) => item?.status === "ACTIVE");
      setResources(normalizedResources);
      setAllCategories(categories);
      setActiveCategories(active);
      if (!republishCategoryId && active.length > 0) setRepublishCategoryId(String(active[0].id));
      if (!nextCategoryId && active.length > 0) setNextCategoryId(String(active[0].id));
    } catch (error) {
      setErrorMessage(error?.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const uniqueStatuses = useMemo(() => {
    const existing = new Set(resources.map((item) => item.status));
    const ordered = STATUS_ORDER.filter((status) => existing.has(status));
    const extras = [...existing].filter((status) => !STATUS_ORDER.includes(status));
    return ["ALL", ...ordered, ...extras];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const query = String(search ?? "").trim().toLowerCase();
    return resources.filter((resource) => {
      if (statusFilter !== "ALL" && resource.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && String(resource.categoryId) !== categoryFilter) return false;
      if (!query) return true;
      const blob = [resource.title, resource.description, resource.contributorId]
        .map((value) => String(value ?? ""))
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [resources, search, statusFilter, categoryFilter]);

  function clearTips() {
    setErrorMessage("");
    setNoticeMessage("");
  }

  async function openDetail(resource) {
    setOpenStatusMenuFor(null);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailResource(normalizeResource(resource));
    try {
      const detail = await getAdminResourceDetail(resource.id);
      setDetailResource(normalizeResource(detail));
    } catch (error) {
      setDetailError(error?.message || "Failed to load resource detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailResource(null);
    setDetailError("");
  }

  function openArchive(resource) {
    setOpenStatusMenuFor(null);
    setArchiveTarget(resource);
    setArchiveReason(resource?.archiveReason ?? "");
    setArchiveOpen(true);
  }

  function openRepublish(resource) {
    setOpenStatusMenuFor(null);
    if (activeCategories.length === 0) {
      setErrorMessage("No ACTIVE category available. Please activate/create category first.");
      return;
    }
    const fallback = resource?.categoryStatus === "ACTIVE" && resource?.categoryId ? resource.categoryId : activeCategories[0].id;
    setRepublishTarget(resource);
    setRepublishCategoryId(String(fallback));
    setRepublishOpen(true);
  }

  function openChangeCategory(resource) {
    setOpenStatusMenuFor(null);
    if (activeCategories.length === 0) {
      setErrorMessage("No ACTIVE category available. Please activate/create category first.");
      return;
    }
    const fallback = resource?.categoryStatus === "ACTIVE" && resource?.categoryId ? resource.categoryId : activeCategories[0].id;
    setChangeCategoryTarget(resource);
    setNextCategoryId(String(fallback));
    setChangeCategoryOpen(true);
  }

  async function refreshDetailIfOpen(resourceId) {
    if (!detailOpen || detailResource?.id !== resourceId) return;
    const detail = await getAdminResourceDetail(resourceId);
    setDetailResource(normalizeResource(detail));
  }

  async function doUnpublish(resource) {
    clearTips();
    setLoading(true);
    try {
      await unpublishAdminResource(resource.id);
      setNoticeMessage(`Resource #${resource.id} unpublished.`);
      await refreshAll();
      await refreshDetailIfOpen(resource.id);
    } catch (error) {
      setErrorMessage(error?.message || "Unpublish failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRepublish(resourceId, categoryId) {
    clearTips();
    setLoading(true);
    try {
      await republishAdminResource(resourceId, Number(categoryId));
      setRepublishOpen(false);
      setRepublishTarget(null);
      setNoticeMessage(`Resource #${resourceId} republished.`);
      await refreshAll();
      await refreshDetailIfOpen(resourceId);
    } catch (error) {
      setErrorMessage(error?.message || "Republish failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitArchive(event) {
    event.preventDefault();
    if (!archiveTarget) return;
    const reason = String(archiveReason ?? "").trim();
    if (!reason) {
      setErrorMessage("Archive reason is required.");
      return;
    }
    clearTips();
    setLoading(true);
    try {
      await archiveAdminResource(archiveTarget.id, reason);
      setArchiveOpen(false);
      setArchiveTarget(null);
      setArchiveReason("");
      setNoticeMessage(`Resource #${archiveTarget.id} archived.`);
      await refreshAll();
      await refreshDetailIfOpen(archiveTarget.id);
    } catch (error) {
      setErrorMessage(error?.message || "Archive failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitChangeCategory(event) {
    event.preventDefault();
    if (!changeCategoryTarget) return;
    if (!nextCategoryId) {
      setErrorMessage("Please select an ACTIVE category.");
      return;
    }
    clearTips();
    setLoading(true);
    try {
      await updateAdminResourceCategory(changeCategoryTarget.id, Number(nextCategoryId));
      setChangeCategoryOpen(false);
      setChangeCategoryTarget(null);
      setNoticeMessage(`Resource #${changeCategoryTarget.id} category updated.`);
      await refreshAll();
      await refreshDetailIfOpen(changeCategoryTarget.id);
    } catch (error) {
      setErrorMessage(error?.message || "Category update failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleStatusSelection(resource, actionKey) {
    setOpenStatusMenuFor(null);
    if (!actionKey) return;
    if (actionKey === "unpublish") {
      doUnpublish(resource);
      return;
    }
    if (actionKey === "archive") {
      openArchive(resource);
      return;
    }
    if (actionKey === "republish") {
      if (resource.categoryStatus !== "ACTIVE" || !resource.categoryId) {
        openRepublish(resource);
      } else {
        submitRepublish(resource.id, resource.categoryId);
      }
    }
  }

  return (
    <div style={styles.layout}>
      <AdminSidebar />
      <main style={styles.main}>
        <div style={styles.page}>

          {/* Page header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.title}>Resource Management</h1>
            <p style={styles.subtitle}>Review resources, adjust status / category, and inspect multimedia details.</p>
          </div>

          {/* Filter bar card */}
          <div style={styles.filterCard}>
            <div style={styles.toolbar}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title / description / contributor ID…"
                style={styles.searchInput}
                disabled={loading}
              />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="ALL">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.select}
                disabled={loading}
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div style={styles.counts}>
              {loading ? "Loading…" : `Total: ${resources.length} · Showing: ${filteredResources.length}`}
            </div>

            {noticeMessage ? <div style={styles.noticeBanner}>{noticeMessage}</div> : null}
            {errorMessage ? <div style={styles.errorBanner}>{errorMessage}</div> : null}
          </div>

          {/* Table card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Resources</span>
              {loading ? <span style={styles.loadingText}>Loading…</span> : null}
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created By</th>
                    <th style={styles.th}>Updated At</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredResources.length === 0 ? (
                    <tr>
                      <td style={styles.emptyCell} colSpan={6}>No resources found.</td>
                    </tr>
                  ) : (
                    filteredResources.map((resource) => {
                      const actions = statusActions(resource.status);
                      return (
                        <tr
                          key={resource.id}
                          style={styles.tr}
                          onClick={() => openDetail(resource)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f7fcf9"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                        >
                          <td style={styles.td}>
                            <div style={styles.titleCell}>
                              <div style={styles.titleText}>{resource.title}</div>
                              <div style={styles.metaText}>#{resource.id}</div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.categoryName}>{resource.categoryName}</div>
                            <span style={{ ...styles.badgeMini, ...categoryBadge(resource.categoryStatus) }}>
                              {resource.categoryStatus}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...statusBadge(resource.status) }}>
                              {resource.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.metaText}>ID: {resource.contributorId ?? "-"}</div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.metaText}>{formatTimestamp(resource.updatedAt)}</div>
                          </td>
                          <td style={styles.td} onClick={(event) => event.stopPropagation()}>
                            <div style={styles.actions}>
                              <button
                                type="button"
                                style={styles.actionBtn}
                                onClick={() => openChangeCategory(resource)}
                                disabled={loading}
                              >
                                Change Category
                              </button>
                              <div style={styles.menuWrap}>
                                <button
                                  type="button"
                                  style={styles.actionBtn}
                                  onClick={() =>
                                    setOpenStatusMenuFor((current) =>
                                      current === resource.id ? null : resource.id
                                    )
                                  }
                                  disabled={loading}
                                >
                                  Status Change ▾
                                </button>
                                {openStatusMenuFor === resource.id ? (
                                  <div style={styles.menuPanel}>
                                    {actions.length === 0 ? (
                                      <div style={styles.menuMuted}>No transition available</div>
                                    ) : (
                                      actions.map((action) => (
                                        <button
                                          key={action.key}
                                          type="button"
                                          style={styles.menuItem}
                                          onClick={() => handleStatusSelection(resource, action.key)}
                                          disabled={loading}
                                        >
                                          {action.label}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Detail drawer */}
      {detailOpen ? (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{detailResource?.title || "Resource Detail"}</h3>
              <button type="button" style={styles.cancelButton} onClick={closeDetail}>Close</button>
            </div>
            {detailLoading ? <div style={styles.loadingDetail}>Loading detail…</div> : null}
            {detailError ? <div style={styles.errorBanner}>{detailError}</div> : null}

            {detailResource ? (
              <>
                <div style={styles.detailGrid}>
                  <div>
                    <strong style={styles.detailLabel}>Status:</strong>
                    {" "}<span style={{ ...styles.badge, ...statusBadge(detailResource.status) }}>{detailResource.status}</span>
                  </div>
                  <div>
                    <strong style={styles.detailLabel}>Category:</strong>
                    <span style={styles.categoryInline}>
                      <span>{detailResource.categoryName}</span>
                      <span style={{ ...styles.badgeMini, ...categoryBadge(detailResource.categoryStatus) }}>
                        {detailResource.categoryStatus}
                      </span>
                    </span>
                  </div>
                  <div><strong style={styles.detailLabel}>Tags:</strong> {detailResource.tags.join(", ") || "-"}</div>
                  <div><strong style={styles.detailLabel}>Contributor ID:</strong> {detailResource.contributorId ?? "-"}</div>
                  <div><strong style={styles.detailLabel}>Created At:</strong> {formatTimestamp(detailResource.createdAt)}</div>
                  <div><strong style={styles.detailLabel}>Updated At:</strong> {formatTimestamp(detailResource.updatedAt)}</div>
                  <div><strong style={styles.detailLabel}>Place:</strong> {detailResource.place || "-"}</div>
                  <div>
                    <strong style={styles.detailLabel}>External Link:</strong>{" "}
                    {detailResource.externalLink ? (
                      <a href={detailResource.externalLink} target="_blank" rel="noreferrer" style={styles.detailLink}>
                        Open link
                      </a>
                    ) : "-"}
                  </div>
                  <div style={styles.detailWide}>
                    <strong style={styles.detailLabel}>Copyright Declaration:</strong>{" "}
                    {detailResource.copyrightDeclaration || "-"}
                  </div>
                  <div style={styles.detailWide}>
                    <strong style={styles.detailLabel}>Archive Reason:</strong>{" "}
                    {detailResource.archiveReason || "-"}
                  </div>
                </div>

                <section style={styles.panel}>
                  <div style={styles.panelTitle}>Description</div>
                  <div style={styles.panelText}>{detailResource.description || "No description."}</div>
                </section>

                <section style={styles.panel}>
                  <div style={styles.panelTitle}>Multimedia Assets</div>
                  {detailResource.media.length === 0 ? (
                    <div style={styles.panelText}>No multimedia attached to this resource.</div>
                  ) : (
                    <div style={styles.mediaGrid}>
                      {detailResource.media.map((item) => {
                        const kind = mediaKind(item);
                        return (
                          <article key={`${item.id}-${item.fileUrl}`} style={styles.mediaCard}>
                            <div style={styles.mediaHead}>
                              <span style={styles.typePill}>{item.mediaType}</span>
                              <span style={styles.metaText}>#{item.id ?? "-"}</span>
                            </div>
                            <div style={styles.mediaName}>{item.fileName || "Unnamed file"}</div>
                            <div style={styles.metaText}>{item.mimeType || "Unknown type"}</div>

                            {kind === "image" ? (
                              <img src={item.fileUrl} alt={item.fileName || "resource media"} style={styles.mediaPreview} loading="lazy" />
                            ) : null}
                            {kind === "video" ? (
                              <video controls style={styles.mediaPreview} src={item.fileUrl}>
                                <track kind="captions" />
                              </video>
                            ) : null}
                            {kind === "audio" ? (
                              <audio controls style={styles.audio} src={item.fileUrl}>Audio not supported.</audio>
                            ) : null}
                            {kind === "file" ? (
                              <a href={item.fileUrl} target="_blank" rel="noreferrer" style={styles.detailLink}>Open file</a>
                            ) : null}

                            <div style={styles.mediaFoot}>
                              Sort: {item.sortOrder ?? 0} · {formatTimestamp(item.uploadedAt)}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Archive modal */}
      {archiveOpen && archiveTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Archive Resource #{archiveTarget.id}</h3>
            </div>
            <form onSubmit={submitArchive} style={styles.modalBody}>
              <label style={styles.formLabel}>Archive Reason <span style={styles.req}>*</span></label>
              <textarea
                value={archiveReason}
                onChange={(event) => setArchiveReason(event.target.value)}
                style={styles.textarea}
                rows={5}
                maxLength={2000}
                placeholder="Please provide an archive reason…"
                disabled={loading}
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setArchiveOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  Confirm Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Republish modal */}
      {republishOpen && republishTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Republish Resource #{republishTarget.id}</h3>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitRepublish(republishTarget.id, republishCategoryId);
              }}
              style={styles.modalBody}
            >
              <label style={styles.formLabel}>Select Active Category</label>
              <select
                value={republishCategoryId}
                onChange={(event) => setRepublishCategoryId(event.target.value)}
                style={styles.selectWide}
                disabled={loading}
              >
                {activeCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setRepublishOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  Confirm Republish
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Change category modal */}
      {changeCategoryOpen && changeCategoryTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Change Category (Resource #{changeCategoryTarget.id})</h3>
            </div>
            <form onSubmit={submitChangeCategory} style={styles.modalBody}>
              <label style={styles.formLabel}>Select Active Category</label>
              <select
                value={nextCategoryId}
                onChange={(event) => setNextCategoryId(event.target.value)}
                style={styles.selectWide}
                disabled={loading}
              >
                {activeCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setChangeCategoryOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  /* ── Layout shell ── */
  layout: {
    minHeight: "100vh",
    background: "#f4f7f5",
    display: "flex",
  },
  main: {
    marginLeft: 260,
    flex: 1,
    padding: "36px 40px",
    minHeight: "100vh",
  },
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
    color: "#374151",
  },

  /* ── Page header ── */
  pageHeader: {
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: "#1a2e1f",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },

  /* ── Filter card ── */
  filterCard: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    padding: "14px 20px",
    marginBottom: 16,
  },
  toolbar: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #e8e3dc",
    background: "#f9fafb",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    minWidth: 160,
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #e8e3dc",
    background: "#f9fafb",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
  },
  counts: {
    marginTop: 10,
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: 500,
  },

  /* ── Banners ── */
  noticeBanner: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.5,
  },
  errorBanner: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
    lineHeight: 1.5,
  },

  /* ── Table card ── */
  card: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderBottom: "1px solid #f0ebe2",
    background: "#fafaf8",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9ca3af",
  },
  loadingText: {
    fontSize: 12,
    color: "#9ca3af",
  },

  /* ── Table ── */
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "11px 16px",
    color: "#6b7280",
    fontSize: 11,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    fontWeight: 700,
    borderBottom: "1px solid #f0ebe2",
    background: "#fafaf8",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f5f1ec",
    transition: "background 120ms ease",
    cursor: "pointer",
  },
  td: {
    padding: "13px 16px",
    borderBottom: "1px solid #f5f1ec",
    verticalAlign: "top",
    color: "#374151",
  },
  emptyCell: {
    padding: "48px 20px",
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 14,
  },
  titleCell: { display: "flex", flexDirection: "column", gap: 3 },
  titleText: { fontWeight: 600, color: "#1a2e1f" },
  metaText: { color: "#9ca3af", fontSize: 12 },
  categoryName: { color: "#374151", fontWeight: 500, marginBottom: 4 },

  /* ── Status badges ── */
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.03em",
    border: "1px solid transparent",
  },
  badgeMini: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    border: "1px solid transparent",
  },
  badgeOk: { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" },
  badgeWarn: { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" },
  badgeDanger: { background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" },
  badgeMuted: { background: "#f3f4f6", color: "#6b7280", borderColor: "#e5e7eb" },
  badgeCatActive: { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" },
  badgeCatInactive: { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" },

  /* ── Row action buttons ── */
  actions: { display: "flex", flexDirection: "column", gap: 6, minWidth: 160 },
  actionBtn: {
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    width: "100%",
    textAlign: "left",
  },
  menuWrap: { position: "relative" },
  menuPanel: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    zIndex: 20,
    width: "100%",
    borderRadius: 10,
    border: "1px solid #e8e3dc",
    background: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
    padding: 6,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  menuItem: {
    borderRadius: 7,
    border: "1px solid #f0ebe2",
    background: "#f9fafb",
    color: "#374151",
    padding: "7px 10px",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  menuMuted: { color: "#9ca3af", fontSize: 12, padding: "7px 10px" },

  /* ── Shared buttons ── */
  primaryButton: {
    padding: "9px 16px",
    borderRadius: 9,
    border: "1px solid #2d6a4f",
    background: "#2d6a4f",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  cancelButton: {
    padding: "8px 16px",
    borderRadius: 9,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },

  /* ── Modal overlay ── */
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.40)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 140,
  },
  modal: {
    width: "min(640px, 100%)",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    background: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  modalLarge: {
    width: "min(1060px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    background: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 20px",
    borderBottom: "1px solid #f0ebe2",
    background: "#fafaf8",
  },
  modalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#1a2e1f",
    letterSpacing: "-0.01em",
  },
  modalBody: {
    padding: "16px 20px 20px",
  },
  formLabel: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: 8,
  },
  req: { color: "#b91c1c" },
  loadingDetail: {
    padding: "16px 20px",
    color: "#9ca3af",
    fontSize: 13,
  },
  textarea: {
    width: "100%",
    marginTop: 2,
    padding: "9px 12px",
    borderRadius: 9,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  selectWide: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 9,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  modalActions: {
    marginTop: 16,
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },

  /* ── Detail view ── */
  detailGrid: {
    margin: "16px 20px 0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    fontSize: 14,
    color: "#374151",
  },
  detailWide: { gridColumn: "1 / span 2" },
  detailLabel: { color: "#6b7280", fontWeight: 700 },
  categoryInline: { display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 },
  detailLink: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 7,
    border: "1.5px solid #86efac",
    background: "#f0fdf4",
    color: "#166534",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 13,
  },

  /* ── Detail panels ── */
  panel: {
    margin: "12px 20px",
    border: "1px solid #f0ebe2",
    borderRadius: 10,
    padding: "12px 14px",
    background: "#fafaf8",
  },
  panelTitle: {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9ca3af",
    fontWeight: 700,
    marginBottom: 8,
  },
  panelText: { color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 },

  /* ── Media grid ── */
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 10,
  },
  mediaCard: {
    border: "1px solid #e8e3dc",
    borderRadius: 10,
    padding: 12,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  mediaHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  typePill: {
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    fontSize: 11,
    letterSpacing: "0.05em",
    color: "#6b7280",
    fontWeight: 600,
  },
  mediaName: { color: "#1a2e1f", fontWeight: 600, wordBreak: "break-word", fontSize: 13 },
  mediaPreview: {
    width: "100%",
    maxHeight: 180,
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid #e8e3dc",
    background: "#f9fafb",
  },
  audio: { width: "100%" },
  mediaFoot: { marginTop: "auto", color: "#9ca3af", fontSize: 11 },
};

export default ResourceManagementPage;
