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
    <div className="flex min-h-screen" style={styles.layout}>
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={styles.main}>
        <div style={styles.page}>
          {successMessage ? (
            <div role="status" style={{ ...styles.toast, ...styles.toastSuccess }}>
              {successMessage}
            </div>
          ) : null}

          <div style={styles.hero}>
            <div style={styles.heroTopRow}>
              <div>
                <h1 style={styles.title}>Category Management</h1>
                <p style={styles.subtitle}>
                  Manage flat categories. Deactivate instead of deleting. Inactive categories stay listed for history;
                  contributor pickers only show ACTIVE. Deactivating sets all APPROVED resources in that category to
                  UNPUBLISHED.
                </p>
              </div>

              <button type="button" onClick={openCreateModal} style={styles.primaryButton} disabled={loading}>
                + New Category
              </button>
            </div>

            <div style={styles.toolbar}>
              <div style={styles.searchWrap}>
                <label htmlFor="category-search" style={styles.srOnly}>
                  Search categories
                </label>
                <input
                  id="category-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or description"
                  style={styles.searchInput}
                  disabled={loading}
                />
                <div style={styles.searchHint}>Searches name and description</div>
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

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Categories</h2>
              {loading ? <span style={styles.loadingText}>Loading...</span> : null}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 110 }}>Category ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={{ ...styles.th, width: 100 }}>Default</th>
                    <th style={styles.th}>Description</th>
                    <th style={{ ...styles.th, width: 120 }}>Status</th>
                    <th style={{ ...styles.th, width: 240 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyCell}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => {
                      const status = category?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
                      const isPreset = category?.is_default === true;
                      return (
                        <tr key={category.id} style={styles.tr}>
                          <td style={styles.tdMono}>{category.id}</td>
                          <td style={styles.td}>
                            <div style={styles.nameCell}>
                              <span style={styles.nameText}>{category.name}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            {isPreset ? (
                              <span style={{ ...styles.badge, ...styles.badgePreset }} title="系统预置分类">
                                DEFAULT
                              </span>
                            ) : (
                              <span style={styles.muted}>—</span>
                            )}
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
                                style={styles.secondaryButton}
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

      {isModalOpen ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Category form">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalKicker}>{modalMode === "create" ? "Create" : "Edit"} Category</div>
                <div style={styles.modalTitle}>Details</div>
              </div>
              <button type="button" onClick={closeModal} style={styles.iconButton} aria-label="Close" disabled={loading}>
                X
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
                <button type="button" onClick={closeModal} style={styles.secondaryButton} disabled={loading}>
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

      {showConfirm ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Deactivate category">
          <div style={styles.confirmModal}>
            <div style={styles.confirmTitle}>Deactivate Category</div>
            <p style={styles.confirmText}>
              Are you sure you want to deactivate this category? It will be hidden from contributor submission
              pickers, and all resources in <strong>APPROVED</strong> status under this category will become{" "}
              <strong>UNPUBLISHED</strong>.
            </p>
            <div style={styles.modalFooter}>
              <button type="button" onClick={closeConfirmModal} style={styles.secondaryButton} disabled={loading}>
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
  layout: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 20% 0%, rgba(255, 233, 210, 0.8), transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(210, 235, 255, 0.75), transparent 52%), #0b0d12",
  },
  main: {
    marginLeft: 260,
  },
  page: {
    minHeight: "100%",
    color: "#eaf0ff",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
    position: "relative",
  },
  toast: {
    position: "sticky",
    top: 8,
    zIndex: 60,
    maxWidth: 420,
    margin: "0 auto 12px",
    padding: "12px 14px",
    borderRadius: 14,
    boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
    backdropFilter: "blur(8px)",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 1.5,
  },
  toastSuccess: {
    border: "1px solid rgba(108, 217, 169, 0.35)",
    background: "rgba(29, 78, 58, 0.88)",
    color: "#ecfff6",
  },
  hero: {
    maxWidth: 1080,
    margin: "0 auto 18px",
    padding: "18px 18px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  heroTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 30,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    maxWidth: 820,
    color: "rgba(234,240,255,0.78)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  toolbar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  searchWrap: {
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "#eaf0ff",
    outline: "none",
  },
  searchHint: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(234,240,255,0.62)",
  },
  metaPills: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(234,240,255,0.82)",
    fontSize: 12,
  },
  metaStrong: { color: "#ffffff" },
  errorBanner: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255, 107, 107, 0.35)",
    background: "rgba(255, 107, 107, 0.12)",
    color: "#ffecec",
    fontSize: 13,
    lineHeight: 1.5,
  },
  card: {
    maxWidth: 1080,
    margin: "0 auto",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.78)",
  },
  loadingText: {
    fontSize: 12,
    color: "rgba(234,240,255,0.65)",
  },
  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 12px",
    color: "rgba(234,240,255,0.70)",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    verticalAlign: "top",
  },
  tdMono: {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: "rgba(234,240,255,0.9)",
  },
  emptyCell: {
    padding: "18px 12px",
    color: "rgba(234,240,255,0.70)",
    fontStyle: "italic",
  },
  nameCell: { display: "flex", alignItems: "center", gap: 10 },
  nameText: { fontWeight: 700, color: "#ffffff" },
  descText: {
    display: "inline-block",
    maxWidth: 520,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "rgba(234,240,255,0.78)",
  },
  muted: { color: "rgba(234,240,255,0.45)" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  badgeActive: {
    background: "rgba(72, 255, 171, 0.12)",
    color: "rgba(162, 255, 210, 0.95)",
    borderColor: "rgba(72, 255, 171, 0.22)",
  },
  badgeInactive: {
    background: "rgba(255, 201, 72, 0.12)",
    color: "rgba(255, 224, 162, 0.95)",
    borderColor: "rgba(255, 201, 72, 0.22)",
  },
  badgePreset: {
    background: "rgba(120, 200, 255, 0.14)",
    color: "rgba(200, 235, 255, 0.98)",
    borderColor: "rgba(120, 200, 255, 0.28)",
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryButton: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(180deg, rgba(120, 170, 255, 0.95), rgba(85, 125, 255, 0.95))",
    color: "#081022",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(45, 110, 255, 0.25)",
  },
  secondaryButton: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf0ff",
    fontWeight: 800,
    cursor: "pointer",
  },
  ghostButton: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    color: "#eaf0ff",
    fontWeight: 900,
    cursor: "pointer",
  },
  ghostDanger: {
    borderColor: "rgba(255, 107, 107, 0.25)",
    color: "rgba(255, 200, 200, 0.95)",
  },
  ghostGood: {
    borderColor: "rgba(72, 255, 171, 0.22)",
    color: "rgba(182, 255, 220, 0.95)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "min(680px, 100%)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(180deg, rgba(20, 24, 35, 0.98), rgba(12, 14, 18, 0.98))",
    boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
    overflow: "hidden",
  },
  confirmModal: {
    width: "min(520px, 100%)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(180deg, rgba(20, 24, 35, 0.98), rgba(12, 14, 18, 0.98))",
    boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
    padding: "20px 20px 18px",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.01em",
    color: "#ffffff",
  },
  confirmText: {
    margin: "12px 0 0",
    color: "rgba(234,240,255,0.78)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  modalKicker: {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.65)",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: "-0.01em",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf0ff",
    cursor: "pointer",
    fontWeight: 900,
  },
  form: { padding: "14px 16px 16px" },
  formRow: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(234,240,255,0.72)",
    marginBottom: 8,
  },
  req: { color: "rgba(255, 200, 200, 0.95)" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "#eaf0ff",
    outline: "none",
  },
  inputError: {
    borderColor: "rgba(255, 107, 107, 0.45)",
    boxShadow: "0 0 0 4px rgba(255, 107, 107, 0.10)",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "#eaf0ff",
    outline: "none",
    resize: "vertical",
  },
  helpText: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(234,240,255,0.58)",
    lineHeight: 1.5,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255, 200, 200, 0.95)",
    lineHeight: 1.4,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 6,
  },
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
