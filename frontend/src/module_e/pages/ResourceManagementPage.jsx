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
  if (normalized === "APPROVED") return styles.ok;
  if (normalized === "UNPUBLISHED") return styles.warn;
  if (normalized === "ARCHIVED") return styles.danger;
  return styles.mutedBadge;
}

function categoryBadge(status) {
  return status === "ACTIVE" ? styles.okMini : styles.warnMini;
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
    <div className="flex min-h-screen" style={styles.layout}>
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={styles.main}>
        <div style={styles.page}>
          <section style={styles.hero}>
            <h1 style={styles.title}>Resource Management</h1>
            <p style={styles.subtitle}>Review resources, adjust status/category, and inspect multimedia details.</p>

            <div style={styles.toolbar}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title / description / contributor_id"
                style={styles.input}
                disabled={loading}
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={styles.select} disabled={loading}>
                <option value="ALL">All Categories</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.select} disabled={loading}>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={styles.counts}>Total: {resources.length} | Showing: {filteredResources.length}</div>
            {noticeMessage ? <div style={styles.notice}>{noticeMessage}</div> : null}
            {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
          </section>

          <section style={styles.card}>
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
                    <td style={styles.td} colSpan={6}>No resources found.</td>
                  </tr>
                ) : (
                  filteredResources.map((resource) => {
                    const actions = statusActions(resource.status);
                    return (
                      <tr key={resource.id} style={styles.tr} onClick={() => openDetail(resource)}>
                        <td style={styles.td}>
                          <div style={styles.titleCell}>
                            <div style={styles.titleText}>{resource.title}</div>
                            <div style={styles.metaText}>#{resource.id}</div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div>{resource.categoryName}</div>
                          <span style={{ ...styles.badgeMini, ...categoryBadge(resource.categoryStatus) }}>{resource.categoryStatus}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...statusBadge(resource.status) }}>{resource.status}</span>
                        </td>
                        <td style={styles.td}>
                          <div>ID: {resource.contributorId ?? "-"}</div>
                        </td>
                        <td style={styles.td}>{formatTimestamp(resource.updatedAt)}</td>
                        <td style={styles.td} onClick={(event) => event.stopPropagation()}>
                          <div style={styles.actions}>
                            <button type="button" style={styles.actionBtn} onClick={() => openChangeCategory(resource)} disabled={loading}>Change Category</button>
                            <div style={styles.menuWrap}>
                              <button
                                type="button"
                                style={styles.actionBtn}
                                onClick={() => setOpenStatusMenuFor((current) => (current === resource.id ? null : resource.id))}
                                disabled={loading}
                                title=""
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
          </section>
        </div>
      </main>

      {detailOpen ? (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{detailResource?.title || "Resource Detail"}</h3>
              <button type="button" style={styles.btn} onClick={closeDetail}>Close</button>
            </div>
            {detailLoading ? <div style={styles.loading}>Loading detail...</div> : null}
            {detailError ? <div style={styles.error}>{detailError}</div> : null}

            {detailResource ? (
              <>
                <div style={styles.detailGrid}>
                  <div><strong style={styles.strong}>Status:</strong> <span style={{ ...styles.badge, ...statusBadge(detailResource.status) }}>{detailResource.status}</span></div>
                  <div>
                    <strong style={styles.strong}>Category:</strong>
                    <span style={styles.categoryInline}>
                      <span>{detailResource.categoryName}</span>
                      <span style={{ ...styles.badgeMini, ...categoryBadge(detailResource.categoryStatus) }}>{detailResource.categoryStatus}</span>
                    </span>
                  </div>
                  <div><strong style={styles.strong}>Tags:</strong> {detailResource.tags.join(", ") || "-"}</div>
                  <div><strong style={styles.strong}>Contributor ID:</strong> {detailResource.contributorId ?? "-"}</div>
                  <div><strong style={styles.strong}>Created At:</strong> {formatTimestamp(detailResource.createdAt)}</div>
                  <div><strong style={styles.strong}>Updated At:</strong> {formatTimestamp(detailResource.updatedAt)}</div>
                  <div><strong style={styles.strong}>Place:</strong> {detailResource.place || "-"}</div>
                  <div>
                    <strong style={styles.strong}>External Link:</strong>{" "}
                    {detailResource.externalLink ? (
                      <a href={detailResource.externalLink} target="_blank" rel="noreferrer" style={styles.link}>
                        Open link
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div style={styles.detailWide}><strong style={styles.strong}>Copyright Declaration:</strong> {detailResource.copyrightDeclaration || "-"}</div>
                  <div style={styles.detailWide}><strong style={styles.strong}>Archive Reason:</strong> {detailResource.archiveReason || "-"}</div>
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

                            {kind === "image" ? <img src={item.fileUrl} alt={item.fileName || "resource media"} style={styles.mediaPreview} loading="lazy" /> : null}
                            {kind === "video" ? <video controls style={styles.mediaPreview} src={item.fileUrl}><track kind="captions" /></video> : null}
                            {kind === "audio" ? <audio controls style={styles.audio} src={item.fileUrl}>Audio not supported.</audio> : null}
                            {kind === "file" ? <a href={item.fileUrl} target="_blank" rel="noreferrer" style={styles.link}>Open file</a> : null}

                            <div style={styles.mediaFoot}>Sort: {item.sortOrder ?? 0} | {formatTimestamp(item.uploadedAt)}</div>
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

      {archiveOpen && archiveTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Archive Resource #{archiveTarget.id}</h3>
            <form onSubmit={submitArchive}>
              <textarea
                value={archiveReason}
                onChange={(event) => setArchiveReason(event.target.value)}
                style={styles.textarea}
                rows={5}
                maxLength={2000}
                placeholder="Please provide archive reason"
                disabled={loading}
              />
              <div style={styles.modalActions}>
                <button type="button" style={styles.btn} onClick={() => setArchiveOpen(false)} disabled={loading}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>Confirm Archive</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {republishOpen && republishTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Republish Resource #{republishTarget.id}</h3>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitRepublish(republishTarget.id, republishCategoryId);
              }}
            >
              <select value={republishCategoryId} onChange={(event) => setRepublishCategoryId(event.target.value)} style={styles.selectWide} disabled={loading}>
                {activeCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btn} onClick={() => setRepublishOpen(false)} disabled={loading}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>Confirm Republish</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {changeCategoryOpen && changeCategoryTarget ? (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Change Category (Resource #{changeCategoryTarget.id})</h3>
            <form onSubmit={submitChangeCategory}>
              <select value={nextCategoryId} onChange={(event) => setNextCategoryId(event.target.value)} style={styles.selectWide} disabled={loading}>
                {activeCategories.map((category) => (
                  <option key={category.id} value={String(category.id)}>{category.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btn} onClick={() => setChangeCategoryOpen(false)} disabled={loading}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  layout: { minHeight: "100vh", background: "radial-gradient(1200px 600px at 20% 0%, rgba(255,233,210,.8), transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(210,235,255,.75), transparent 52%), #0b0d12" },
  main: { marginLeft: 260 },
  page: { color: "#eef3ff", fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif' },
  hero: { maxWidth: 1280, margin: "0 auto 18px", padding: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" },
  title: { margin: 0, fontSize: 32 },
  subtitle: { marginTop: 8, color: "rgba(238,243,255,.78)", fontSize: 14 },
  toolbar: { display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap" },
  input: { width: "100%", maxWidth: 560, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)", color: "#eef3ff", outline: "none" },
  select: { minWidth: 180, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)", color: "#eef3ff", outline: "none" },
  selectWide: { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)", color: "#eef3ff", outline: "none" },
  counts: { marginTop: 10, color: "rgba(238,243,255,.72)", fontSize: 12 },
  notice: { marginTop: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(72,255,171,.35)", background: "rgba(72,255,171,.12)", color: "#ddffed" },
  error: { marginTop: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,107,107,.35)", background: "rgba(255,107,107,.12)", color: "#ffecec" },
  card: { maxWidth: 1280, margin: "0 auto", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.24)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 },
  th: { textAlign: "left", padding: 12, color: "rgba(238,243,255,.72)", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,.1)", whiteSpace: "nowrap", letterSpacing: ".08em", textTransform: "uppercase" },
  tr: { cursor: "pointer" },
  td: { padding: 12, borderBottom: "1px solid rgba(255,255,255,.08)", color: "#eef3ff", verticalAlign: "top" },
  titleCell: { display: "flex", flexDirection: "column", gap: 4 },
  titleText: { fontWeight: 800, color: "#fff" },
  metaText: { color: "rgba(238,243,255,.62)", fontSize: 12 },
  badge: { display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontSize: 12, border: "1px solid rgba(255,255,255,.14)" },
  badgeMini: { display: "inline-flex", padding: "3px 8px", borderRadius: 999, fontSize: 11, border: "1px solid rgba(255,255,255,.14)", marginTop: 6, width: "fit-content" },
  ok: { background: "rgba(72,255,171,.12)", color: "rgba(174,255,218,.96)", borderColor: "rgba(72,255,171,.24)" },
  warn: { background: "rgba(255,201,72,.12)", color: "rgba(255,227,164,.96)", borderColor: "rgba(255,201,72,.24)" },
  danger: { background: "rgba(255,107,107,.12)", color: "rgba(255,203,203,.96)", borderColor: "rgba(255,107,107,.26)" },
  mutedBadge: { background: "rgba(172,160,255,.12)", color: "rgba(228,223,255,.96)", borderColor: "rgba(172,160,255,.25)" },
  okMini: { background: "rgba(72,255,171,.1)", color: "rgba(174,255,218,.96)", borderColor: "rgba(72,255,171,.24)" },
  warnMini: { background: "rgba(255,170,107,.1)", color: "rgba(255,223,190,.95)", borderColor: "rgba(255,170,107,.24)" },
  actions: { display: "flex", flexDirection: "column", gap: 8, minWidth: 170 },
  actionBtn: { padding: "9px 11px", borderRadius: 11, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "#eef3ff", cursor: "pointer", fontWeight: 700, width: "100%", textAlign: "left" },
  btn: { padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "#eef3ff", cursor: "pointer", fontWeight: 700, width: "auto", textAlign: "center" },
  btnPrimary: { padding: "9px 11px", borderRadius: 11, border: "1px solid rgba(255,255,255,.18)", background: "linear-gradient(180deg, rgba(120,170,255,.95), rgba(85,125,255,.95))", color: "#071022", cursor: "pointer", fontWeight: 900 },
  menuWrap: { position: "relative" },
  menuPanel: { position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 16, width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(15,20,31,.98)", padding: 6, display: "flex", flexDirection: "column", gap: 4 },
  menuItem: { borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#eef3ff", padding: "7px 9px", textAlign: "left", cursor: "pointer", fontWeight: 700 },
  menuMuted: { color: "rgba(238,243,255,.64)", fontSize: 12, padding: "7px 9px" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.66)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 140 },
  modal: { width: "min(680px, 100%)", borderRadius: 16, border: "1px solid rgba(255,255,255,.14)", background: "linear-gradient(180deg, rgba(20,24,35,.99), rgba(11,14,24,.99))", color: "#f7fbff", padding: 16 },
  modalLarge: { width: "min(1100px, 100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,.14)", background: "linear-gradient(180deg, rgba(20,24,35,.99), rgba(11,14,24,.99))", color: "#f7fbff", padding: 16 },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  modalTitle: { margin: 0, fontSize: 24, color: "#fff" },
  loading: { marginTop: 10, color: "rgba(238,243,255,.8)", fontSize: 13 },
  detailGrid: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14, color: "#f7fbff" },
  detailWide: { gridColumn: "1 / span 2" },
  strong: { color: "#dfe8ff" },
  categoryInline: { display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 },
  panel: { marginTop: 12, border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,.03)" },
  panelTitle: { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(238,243,255,.72)", marginBottom: 8 },
  panelText: { color: "#f7fbff", whiteSpace: "pre-wrap", lineHeight: 1.6 },
  mediaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 },
  mediaCard: { border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 10, background: "rgba(0,0,0,.24)", display: "flex", flexDirection: "column", gap: 8 },
  mediaHead: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  typePill: { padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", fontSize: 11, letterSpacing: ".05em", color: "#eef3ff" },
  mediaName: { color: "#fff", fontWeight: 700, wordBreak: "break-word" },
  mediaPreview: { width: "100%", maxHeight: 180, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.28)" },
  audio: { width: "100%" },
  link: { display: "inline-block", width: "fit-content", padding: "6px 9px", borderRadius: 8, border: "1px solid rgba(120,170,255,.34)", background: "rgba(120,170,255,.12)", color: "#d3e2ff", textDecoration: "none", fontWeight: 700 },
  mediaFoot: { marginTop: "auto", color: "rgba(238,243,255,.58)", fontSize: 11 },
  textarea: { width: "100%", marginTop: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)", color: "#eef3ff", resize: "vertical", outline: "none" },
  modalActions: { marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 },
};

export default ResourceManagementPage;
