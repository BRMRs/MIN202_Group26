import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/module_e/components";
import { listCategories } from "@/module_e/api/categoryApi";
import {
  archiveAdminResource,
  listAdminResources,
  republishAdminResource,
  unpublishAdminResource,
} from "@/module_e/api/resourceAdminApi";

const canUnpublish = (status) => status === "APPROVED";
const canArchive = (status) => status === "APPROVED" || status === "UNPUBLISHED";
const canRepublish = (status) => status === "UNPUBLISHED";
const toPublicVisibility = (status) => (status === "APPROVED" ? "Visible" : "Hidden");

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function normalizeResource(item) {
  return {
    id: item.id,
    title: item.title ?? "Untitled",
    contributorName: item.contributorName ?? "Unknown",
    categoryId: item.categoryId ?? null,
    categoryName: item.categoryName ?? "Unassigned",
    categoryStatus: item.categoryStatus ?? "INACTIVE",
    status: item.status ?? "DRAFT",
    updatedAt: item.updatedAt,
    tags: Array.isArray(item.tags) ? item.tags : [],
  };
}

function ResourceManagementPage() {
  const [resources, setResources] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, id: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [republishTarget, setRepublishTarget] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  async function refreshAll() {
    setLoading(true);
    setErrorMessage("");
    try {
      const [resourceRows, categories] = await Promise.all([listAdminResources(), listCategories()]);
      setResources((resourceRows ?? []).map(normalizeResource));
      const active = (categories ?? []).filter((category) => category?.status === "ACTIVE");
      setActiveCategories(active);
      if (!selectedCategoryId && active.length > 0) {
        setSelectedCategoryId(String(active[0].id));
      }
    } catch (error) {
      setErrorMessage(error?.message || "Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!menu.visible) {
      return undefined;
    }

    const close = () => setMenu((previous) => ({ ...previous, visible: false }));
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);

    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu.visible]);

  const contextResource = resources.find((resource) => resource.id === menu.id) ?? null;

  const filteredResources = useMemo(() => {
    const query = String(search ?? "").trim().toLowerCase();
    return resources.filter((resource) => {
      if (statusFilter !== "ALL" && resource.status !== statusFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const keywords = `${resource.title} ${resource.contributorName} ${resource.categoryName} ${resource.status} ${resource.tags.join(" ")}`.toLowerCase();
      return keywords.includes(query);
    });
  }, [resources, search, statusFilter]);

  function openContextMenu(event, resource) {
    event.preventDefault();
    setMenu({ visible: true, x: event.clientX, y: event.clientY, id: resource.id });
  }

  function openRepublishModal(resource) {
    if (activeCategories.length === 0) {
      setErrorMessage("No ACTIVE category available. Please activate/create a category first.");
      return;
    }
    setRepublishTarget(resource);
    const fallback = resource.categoryId ?? activeCategories[0].id;
    setSelectedCategoryId(String(fallback));
    setModalOpen(true);
  }

  async function handleAction(resource, action) {
    setErrorMessage("");
    setNoticeMessage("");
    if (!resource) return;

    try {
      setLoading(true);
      if (action === "UNPUBLISH") {
        if (!canUnpublish(resource.status)) throw new Error("Only APPROVED resources can be unpublished.");
        await unpublishAdminResource(resource.id);
        setNoticeMessage("Resource unpublished.");
      } else if (action === "ARCHIVE") {
        if (!canArchive(resource.status)) throw new Error("Only APPROVED or UNPUBLISHED resources can be archived.");
        await archiveAdminResource(resource.id);
        setNoticeMessage("Resource archived.");
      } else if (action === "REPUBLISH") {
        if (!canRepublish(resource.status)) throw new Error("Only UNPUBLISHED resources can be republished.");
        if (resource.categoryStatus !== "ACTIVE" || !resource.categoryId) {
          setLoading(false);
          openRepublishModal(resource);
          return;
        }
        await republishAdminResource(resource.id, resource.categoryId);
        setNoticeMessage("Resource republished.");
      }
      await refreshAll();
    } catch (error) {
      setErrorMessage(error?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRepublishWithCategory(event) {
    event.preventDefault();
    if (!republishTarget) return;
    if (!selectedCategoryId) {
      setErrorMessage("Please select an ACTIVE category.");
      return;
    }
    try {
      setLoading(true);
      await republishAdminResource(republishTarget.id, Number(selectedCategoryId));
      setModalOpen(false);
      setRepublishTarget(null);
      setNoticeMessage("Resource republished with active category.");
      await refreshAll();
    } catch (error) {
      setErrorMessage(error?.message || "Republish failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" style={styles.layout}>
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={styles.main}>
        <div style={styles.page}>
          <section style={styles.hero}>
            <h1 style={styles.title}>Resource Management</h1>
            <p style={styles.subtitle}>Right-click row for Unpublish, Republish, Archive.</p>
            <div style={styles.toolbar}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title / contributor / category / status / tag"
                style={styles.input}
                disabled={loading}
              />
              <div style={styles.filters}>
                {["ALL", "APPROVED", "UNPUBLISHED", "ARCHIVED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    style={{ ...styles.filterBtn, ...(statusFilter === status ? styles.filterBtnActive : null) }}
                    onClick={() => setStatusFilter(status)}
                    disabled={loading}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            {noticeMessage ? <div style={styles.notice}>{noticeMessage}</div> : null}
            {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
          </section>

          <section style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Contributor</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Category State</th>
                  <th style={styles.th}>Tags</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Public</th>
                  <th style={styles.th}>Updated</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredResources.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan={10}>No resources found.</td>
                  </tr>
                ) : (
                  filteredResources.map((resource) => (
                    <tr key={resource.id} onContextMenu={(event) => openContextMenu(event, resource)}>
                      <td style={styles.td}>{resource.id}</td>
                      <td style={styles.td}>{resource.title}</td>
                      <td style={styles.td}>{resource.contributorName}</td>
                      <td style={styles.td}>{resource.categoryName}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(resource.categoryStatus === "ACTIVE" ? styles.ok : styles.warn) }}>
                          {resource.categoryStatus}
                        </span>
                      </td>
                      <td style={styles.td}>{resource.tags.join(", ") || "-"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(resource.status === "APPROVED" ? styles.ok : resource.status === "UNPUBLISHED" ? styles.warn : styles.danger) }}>
                          {resource.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(toPublicVisibility(resource.status) === "Visible" ? styles.info : styles.dim) }}>
                          {toPublicVisibility(resource.status)}
                        </span>
                      </td>
                      <td style={styles.td}>{formatTimestamp(resource.updatedAt)}</td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button type="button" style={{ ...styles.btn, ...(canUnpublish(resource.status) ? null : styles.disabled) }} onClick={() => handleAction(resource, "UNPUBLISH")} disabled={!canUnpublish(resource.status) || loading}>Unpublish</button>
                          <button type="button" style={{ ...styles.btn, ...(canRepublish(resource.status) ? styles.goodBtn : styles.disabled) }} onClick={() => handleAction(resource, "REPUBLISH")} disabled={!canRepublish(resource.status) || loading}>Republish</button>
                          <button type="button" style={{ ...styles.btnGhost, ...(canArchive(resource.status) ? styles.dangerBtn : styles.disabled) }} onClick={() => handleAction(resource, "ARCHIVE")} disabled={!canArchive(resource.status) || loading}>Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      {menu.visible && contextResource ? (
        <div style={{ ...styles.menu, left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
          <button type="button" style={{ ...styles.menuItem, ...(canUnpublish(contextResource.status) ? null : styles.disabled) }} onClick={() => { handleAction(contextResource, "UNPUBLISH"); setMenu((previous) => ({ ...previous, visible: false })); }} disabled={!canUnpublish(contextResource.status)}>Unpublish</button>
          <button type="button" style={{ ...styles.menuItem, ...(canRepublish(contextResource.status) ? styles.goodMenu : styles.disabled) }} onClick={() => { handleAction(contextResource, "REPUBLISH"); setMenu((previous) => ({ ...previous, visible: false })); }} disabled={!canRepublish(contextResource.status)}>Republish</button>
          <button type="button" style={{ ...styles.menuItem, ...(canArchive(contextResource.status) ? styles.dangerMenu : styles.disabled) }} onClick={() => { handleAction(contextResource, "ARCHIVE"); setMenu((previous) => ({ ...previous, visible: false })); }} disabled={!canArchive(contextResource.status)}>Archive</button>
        </div>
      ) : null}

      {modalOpen && republishTarget ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Select Active Category</h3>
            <p style={styles.modalText}>Current category is not active. Select an ACTIVE category before republish.</p>
            <form onSubmit={submitRepublishWithCategory}>
              <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} style={styles.input} disabled={loading}>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <div style={styles.modalActions}>
                <button type="button" style={styles.btn} onClick={() => { setModalOpen(false); setRepublishTarget(null); }} disabled={loading}>Cancel</button>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>Confirm Republish</button>
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
  page: { color: "#eaf0ff", fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif' },
  hero: { maxWidth: 1240, margin: "0 auto 18px", padding: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))" },
  title: { margin: 0, fontSize: 30 },
  subtitle: { margin: "10px 0 0", color: "rgba(234,240,255,.78)", fontSize: 14 },
  toolbar: { display: "flex", gap: 12, marginTop: 16, alignItems: "center", justifyContent: "space-between" },
  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterBtn: { padding: "8px 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#eaf0ff", fontSize: 12, cursor: "pointer" },
  filterBtnActive: { borderColor: "rgba(120,170,255,.45)", background: "rgba(120,170,255,.16)" },
  input: { width: "100%", maxWidth: 560, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.25)", color: "#eaf0ff" },
  notice: { marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(72,255,171,.35)", background: "rgba(72,255,171,.12)" },
  error: { marginTop: 12, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,107,107,.35)", background: "rgba(255,107,107,.12)" },
  card: { maxWidth: 1240, margin: "0 auto", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.22)", overflow: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 },
  th: { textAlign: "left", padding: 12, color: "rgba(234,240,255,.75)", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,.1)", whiteSpace: "nowrap" },
  td: { padding: 12, borderBottom: "1px solid rgba(255,255,255,.08)", color: "rgba(234,240,255,.85)", verticalAlign: "top" },
  badge: { display: "inline-flex", padding: "6px 10px", borderRadius: 999, fontSize: 12, border: "1px solid rgba(255,255,255,.1)" },
  ok: { background: "rgba(72,255,171,.12)", color: "rgba(162,255,210,.95)", borderColor: "rgba(72,255,171,.22)" },
  warn: { background: "rgba(255,201,72,.12)", color: "rgba(255,224,162,.95)", borderColor: "rgba(255,201,72,.22)" },
  danger: { background: "rgba(255,107,107,.12)", color: "rgba(255,200,200,.95)", borderColor: "rgba(255,107,107,.26)" },
  info: { background: "rgba(120,170,255,.12)", color: "rgba(210,226,255,.95)", borderColor: "rgba(120,170,255,.26)" },
  dim: { background: "rgba(180,188,209,.10)", color: "rgba(224,228,238,.92)", borderColor: "rgba(180,188,209,.24)" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "#eaf0ff", cursor: "pointer" },
  btnPrimary: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.18)", background: "linear-gradient(180deg, rgba(120,170,255,.95), rgba(85,125,255,.95))", color: "#081022", fontWeight: 800, cursor: "pointer" },
  btnGhost: { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "rgba(0,0,0,.18)", color: "#eaf0ff", cursor: "pointer" },
  goodBtn: { borderColor: "rgba(72,255,171,.25)", color: "rgba(182,255,220,.95)" },
  dangerBtn: { borderColor: "rgba(255,107,107,.25)", color: "rgba(255,200,200,.95)" },
  disabled: { opacity: 0.4, cursor: "not-allowed" },
  menu: { position: "fixed", width: 180, borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "linear-gradient(180deg, rgba(24,28,40,.98), rgba(14,16,24,.98))", zIndex: 100 },
  menuItem: { width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid rgba(255,255,255,.08)", background: "transparent", color: "rgba(234,240,255,.92)", cursor: "pointer" },
  goodMenu: { color: "rgba(182,255,220,.95)" },
  dangerMenu: { color: "rgba(255,206,206,.98)" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 120 },
  modal: { width: "min(620px, 100%)", borderRadius: 16, border: "1px solid rgba(255,255,255,.14)", background: "linear-gradient(180deg, rgba(20,24,35,.98), rgba(12,14,18,.98))", padding: 16 },
  modalTitle: { margin: 0, fontSize: 20 },
  modalText: { margin: "10px 0 12px", color: "rgba(234,240,255,.8)", fontSize: 14 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 },
};

export default ResourceManagementPage;
