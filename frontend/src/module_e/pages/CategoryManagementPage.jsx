import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/module_e/components";
import {
  createCategory,
  listCategories,
  updateCategory,
  updateCategoryStatus,
} from "@/module_e/api/categoryApi";

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"];

function normalizeCategoryName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  async function refreshCategories() {
    setErrorMessage("");
    setLoading(true);
    try {
      const data = await listCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = String(search ?? "").trim().toLowerCase();
    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      const name = String(category?.name ?? "").toLowerCase();
      const description = String(category?.description ?? "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [categories, search]);

  function openCreateModal() {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("create");
    setEditingId(null);
    setForm({ name: "", description: "", status: "ACTIVE" });
    setIsModalOpen(true);
  }

  function openEditModal(category) {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("edit");
    setEditingId(category?.id ?? null);
    setForm({
      name: String(category?.name ?? ""),
      description: String(category?.description ?? ""),
      status: category?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
    setEditingId(null);
  }

  function closeConfirmModal() {
    setShowConfirm(false);
    setPendingCategory(null);
  }

  function showOperationSucceeded(message) {
    setErrorMessage("");
    setSuccessMessage(message);
  }

  function showOperationFailed(error, fallbackMessage) {
    setSuccessMessage("");
    setErrorMessage(error?.message || fallbackMessage);
  }

  function validateForm(nextForm) {
    const errors = {};
    const trimmedName = String(nextForm?.name ?? "").trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else {
      const normalized = normalizeCategoryName(trimmedName);
      const duplicate = categories.some((category) => {
        if (modalMode === "edit" && category.id === editingId) {
          return false;
        }
        return normalizeCategoryName(category.name) === normalized;
      });

      if (duplicate) {
        errors.name = "Name must be unique.";
      }
    }

    if (!ALLOWED_STATUSES.includes(nextForm?.status)) {
      errors.status = "Status must be ACTIVE or INACTIVE.";
    }

    return errors;
  }

  async function handleSave(event) {
    event?.preventDefault?.();
    setErrorMessage("");

    const nextForm = {
      ...form,
      name: String(form?.name ?? "").trim(),
      description: String(form?.description ?? ""),
      status: form?.status,
    };

    const errors = validateForm(nextForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        await createCategory({
          name: nextForm.name,
          description: nextForm.description,
          status: nextForm.status,
        });
        closeModal();
        await refreshCategories();
        showOperationSucceeded("Category created successfully.");
      } else {
        await updateCategory(editingId, {
          name: nextForm.name,
          description: nextForm.description,
          status: nextForm.status,
        });
        closeModal();
        await refreshCategories();
        showOperationSucceeded("Category updated successfully.");
      }
    } catch (error) {
      showOperationFailed(error, "Failed to save category.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggleStatus(category) {
    const currentStatus = category?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    if (nextStatus === "INACTIVE") {
      setPendingCategory(category);
      setShowConfirm(true);
      return;
    }

    setErrorMessage("");
    setLoading(true);

    updateCategoryStatus(category.id, nextStatus)
      .then(async () => {
        await refreshCategories();
        showOperationSucceeded("Category reactivated successfully.");
      })
      .catch((error) => {
        showOperationFailed(error, "Failed to update status.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function handleConfirmDeactivate() {
    if (!pendingCategory?.id) {
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      await updateCategoryStatus(pendingCategory.id, "INACTIVE");
      await refreshCategories();
      closeConfirmModal();
      showOperationSucceeded("Category deactivated successfully.");
    } catch (error) {
      showOperationFailed(error, "Failed to deactivate category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.layout}>
      <AdminSidebar />
      <main style={styles.main}>
        <div style={styles.page}>

          {/* Success toast */}
          {successMessage ? (
            <div role="status" style={{ ...styles.toast, ...styles.toastSuccess }}>
              {successMessage}
            </div>
          ) : null}

          {/* Page header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerRow}>
              <div>
                <h1 style={styles.title}>Category Management</h1>
                <p style={styles.subtitle}>
                  Manage flat categories. Deactivate instead of deleting. Inactive categories remain visible for
                  historical queries.
                </p>
              </div>
              <button type="button" onClick={openCreateModal} style={styles.primaryButton} disabled={loading}>
                + New Category
              </button>
            </div>

            {/* Search + meta */}
            <div style={styles.toolbar}>
              <div style={styles.searchWrap}>
                <label htmlFor="category-search" style={styles.srOnly}>
                  Search categories
                </label>
                <input
                  id="category-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or description…"
                  style={styles.searchInput}
                  disabled={loading}
                />
              </div>
              <div style={styles.metaPills}>
                <span style={styles.metaPill}>
                  Total: <strong style={styles.metaStrong}>{categories.length}</strong>
                </span>
                <span style={styles.metaPill}>
                  Showing: <strong style={styles.metaStrong}>{filteredCategories.length}</strong>
                </span>
              </div>
            </div>

            {errorMessage ? (
              <div role="alert" style={styles.errorBanner}>
                {errorMessage}
              </div>
            ) : null}
          </div>

          {/* Table card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Categories</span>
              {loading ? <span style={styles.loadingText}>Loading…</span> : null}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 110 }}>Category ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Description</th>
                    <th style={{ ...styles.th, width: 120 }}>Status</th>
                    <th style={{ ...styles.th, width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={styles.emptyCell}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => {
                      const status = category?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
                      return (
                        <tr
                          key={category.id}
                          style={styles.tr}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f7fcf9"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                        >
                          <td style={styles.tdMono}>{category.id}</td>
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <span style={styles.nameText}>{category.name}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span title={category.description || ""} style={styles.descText}>
                              {category.description || <span style={styles.muted}>No description</span>}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                ...(status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive),
                              }}
                            >
                              {status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actions}>
                              <button
                                type="button"
                                style={styles.editBtn}
                                onClick={() => openEditModal(category)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                style={{
                                  ...styles.ghostButton,
                                  ...(status === "ACTIVE" ? styles.ghostDanger : styles.ghostGood),
                                }}
                                onClick={() => handleToggleStatus(category)}
                                disabled={loading}
                              >
                                {status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                              </button>
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

      {/* Create / Edit modal */}
      {isModalOpen ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Category form">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalKicker}>{modalMode === "create" ? "Create" : "Edit"} Category</div>
                <div style={styles.modalTitle}>Details</div>
              </div>
              <button type="button" onClick={closeModal} style={styles.iconButton} aria-label="Close" disabled={loading}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="category-name">
                  Name <span style={styles.req}>*</span>
                </label>
                <input
                  id="category-name"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  style={{ ...styles.input, ...(formErrors.name ? styles.inputError : null) }}
                  placeholder="e.g., Frontend"
                  disabled={loading}
                />
                {formErrors.name ? <div style={styles.fieldError}>{formErrors.name}</div> : null}
                <div style={styles.helpText}>Name must stay unique across all categories.</div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="category-description">
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  style={styles.textarea}
                  placeholder="Optional short description"
                  rows={4}
                  disabled={loading}
                />
                <div style={styles.helpText}>Search includes description.</div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="category-status">
                  Status <span style={styles.req}>*</span>
                </label>
                <select
                  id="category-status"
                  value={form.status}
                  onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value }))}
                  style={{ ...styles.input, ...(formErrors.status ? styles.inputError : null) }}
                  disabled={loading}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                {formErrors.status ? <div style={styles.fieldError}>{formErrors.status}</div> : null}
                <div style={styles.helpText}>
                  Inactive categories remain visible in admin but cannot be used for new submissions.
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeModal} style={styles.cancelButton} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  {modalMode === "create" ? "Create" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Deactivate confirm modal */}
      {showConfirm ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Deactivate category">
          <div style={styles.confirmModal}>
            <div style={styles.confirmTitle}>Deactivate Category</div>
            <p style={styles.confirmText}>
              Are you sure you want to deactivate this category? This will hide it from the resource selection.
            </p>
            <div style={styles.modalFooter}>
              <button type="button" onClick={closeConfirmModal} style={styles.cancelButton} disabled={loading}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                style={{ ...styles.ghostButton, ...styles.ghostDanger }}
                disabled={loading}
              >
                Deactivate
              </button>
            </div>
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
    maxWidth: 1080,
    margin: "0 auto",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
    color: "#374151",
    position: "relative",
  },

  /* ── Toast ── */
  toast: {
    position: "sticky",
    top: 8,
    zIndex: 60,
    maxWidth: 420,
    margin: "0 auto 16px",
    padding: "11px 14px",
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 1.5,
  },
  toastSuccess: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
  },

  /* ── Page header ── */
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
    letterSpacing: "-0.02em",
    color: "#1a2e1f",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 680,
  },

  /* ── Search toolbar ── */
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  searchWrap: {
    flex: 1,
    minWidth: 240,
  },
  searchInput: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  metaPills: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#6b7280",
    fontSize: 12,
  },
  metaStrong: { color: "#374151", fontWeight: 700 },

  /* ── Error banner ── */
  errorBanner: {
    marginTop: 12,
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
    padding: "11px 20px",
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
  },
  td: {
    padding: "13px 20px",
    borderBottom: "1px solid #f5f1ec",
    verticalAlign: "middle",
    color: "#374151",
  },
  tdMono: {
    padding: "13px 20px",
    borderBottom: "1px solid #f5f1ec",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
    color: "#9ca3af",
    fontSize: 13,
    verticalAlign: "middle",
  },
  emptyCell: {
    padding: "48px 20px",
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 14,
  },
  nameCell: { display: "flex", alignItems: "center", gap: 10 },
  nameText: { fontWeight: 600, color: "#1a2e1f" },
  descText: {
    display: "inline-block",
    maxWidth: 440,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#6b7280",
  },
  muted: { color: "#9ca3af" },

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
  badgeActive: {
    background: "#dcfce7",
    color: "#166534",
    borderColor: "#bbf7d0",
  },
  badgeInactive: {
    background: "#fef3c7",
    color: "#92400e",
    borderColor: "#fde68a",
  },

  /* ── Action buttons ── */
  actions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
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
    lineHeight: 1.4,
  },
  editBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid #86efac",
    background: "#f0fdf4",
    color: "#166534",
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
  ghostButton: {
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1.5px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
  },
  ghostDanger: {
    borderColor: "#fca5a5",
    background: "#fff1f2",
    color: "#b91c1c",
  },
  ghostGood: {
    borderColor: "#86efac",
    background: "#f0fdf4",
    color: "#166534",
  },

  /* ── Modal overlay ── */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.40)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "min(640px, 100%)",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    background: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  confirmModal: {
    width: "min(480px, 100%)",
    borderRadius: 14,
    border: "1px solid #e8e3dc",
    background: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    padding: "24px 24px 20px",
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "#1a2e1f",
  },
  confirmText: {
    margin: "10px 0 16px",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid #f0ebe2",
    background: "#fafaf8",
  },
  modalKicker: {
    fontSize: 11,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "#9ca3af",
    fontWeight: 700,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "#1a2e1f",
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid #e8e3dc",
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Form ── */
  form: { padding: "16px 20px 20px" },
  formRow: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6b7280",
    fontWeight: 700,
    marginBottom: 6,
  },
  req: { color: "#b91c1c" },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 9,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  inputError: {
    borderColor: "#fca5a5",
    boxShadow: "0 0 0 3px rgba(252,165,165,0.15)",
  },
  textarea: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 9,
    border: "1px solid #e8e3dc",
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  helpText: {
    marginTop: 5,
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 1.5,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    color: "#b91c1c",
    lineHeight: 1.4,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 8,
  },

  /* ── Accessibility ── */
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: 0,
  },
};

export default CategoryManagementPage;
