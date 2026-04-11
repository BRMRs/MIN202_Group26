import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/module_e/components";
import { createTag, deleteTag, getTags, restoreTag, updateTag } from "@/module_e/api/tagApi";

const INITIAL_MOCK_TAGS = [
  { id: 2001, name: "Architecture" },
  { id: 2002, name: "Accessibility" },
  { id: 2003, name: "Performance" },
];

function normalizeTagName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cloneTag(tag) {
  return { ...tag };
}

function isBackendUnavailable(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load tags") ||
    message.includes("connect to the backend")
  );
}

function TagManagementPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  async function refreshTags() {
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await getTags();
      setTags(Array.isArray(data) ? data : []);
      setIsUsingMockData(false);
    } catch (error) {
      if (isBackendUnavailable(error)) {
        setTags(INITIAL_MOCK_TAGS.map(cloneTag));
        setIsUsingMockData(true);
        setErrorMessage("Backend unavailable. Showing local mock tags.");
      } else {
        setErrorMessage(error?.message || "Failed to load tags.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshTags();
  }, []);

  const filteredTags = useMemo(() => {
    const query = String(search ?? "").trim().toLowerCase();
    if (!query) {
      return tags;
    }

    return tags.filter((tag) => {
      const name = String(tag?.name ?? "").toLowerCase();
      return name.includes(query);
    });
  }, [tags, search]);

  function openCreateModal() {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("create");
    setEditingId(null);
    setForm({ name: "" });
    setIsModalOpen(true);
  }

  function openEditModal(tag) {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("edit");
    setEditingId(tag?.id ?? null);
    setForm({ name: String(tag?.name ?? "") });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
    setEditingId(null);
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function showOperationFailed(error, fallbackMessage = "Operation failed.") {
    setSuccessMessage("");
    setErrorMessage(error?.message || fallbackMessage);
  }

  function showOperationSucceeded(message) {
    setErrorMessage("");
    setSuccessMessage(message);
  }

  function validateForm(nextForm) {
    const errors = {};
    const trimmedName = String(nextForm?.name ?? "").trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else {
      const normalized = normalizeTagName(trimmedName);
      const duplicate = tags.some((tag) => {
        if (modalMode === "edit" && tag.id === editingId) {
          return false;
        }
        return normalizeTagName(tag.name) === normalized;
      });

      if (duplicate) {
        errors.name = "Name must be unique.";
      }
    }

    return errors;
  }

  function createMockTag(nextForm) {
    const nextId = Math.max(0, ...tags.map((tag) => Number(tag.id) || 0)) + 1;
    const newTag = { id: nextId, name: nextForm.name };
    setTags((previous) => [newTag, ...previous]);
  }

  function updateMockTag(nextForm) {
    setTags((previous) =>
      previous.map((tag) =>
        tag.id === editingId
          ? {
              ...tag,
              name: nextForm.name,
            }
          : tag
      )
    );
  }

  function deleteMockTag(id) {
    setTags((previous) => previous.filter((tag) => tag.id !== id));
  }

  async function handleSave(event) {
    event?.preventDefault?.();
    setErrorMessage("");

    const nextForm = {
      name: String(form?.name ?? "").trim(),
    };

    const errors = validateForm(nextForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      if (modalMode === "create") {
        if (isUsingMockData) {
          createMockTag(nextForm);
          showOperationSucceeded("Tag created successfully.");
        } else {
          const createResult = await createTag(nextForm);

          if (createResult?.status === "DELETED_EXISTS" && createResult?.tagId) {
            setConfirmDialog({
              title: "Tag Already Exists",
              content: "A deleted tag with the same name was found. Would you like to restore it?",
              okText: "Restore",
              cancelText: "Cancel",
              onConfirm: async () => {
                await restoreTag(createResult.tagId);
                await refreshTags();
                closeModal();
                showOperationSucceeded("Tag restored successfully.");
              },
            });
            return;
          }

          await refreshTags();
          showOperationSucceeded("Tag created successfully.");
        }
      } else if (isUsingMockData) {
        updateMockTag(nextForm);
        showOperationSucceeded("Tag updated successfully.");
      } else {
        await updateTag(editingId, nextForm);
        await refreshTags();
        showOperationSucceeded("Tag updated successfully.");
      }

      closeModal();
    } catch (error) {
      showOperationFailed(error);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(tag) {
    setConfirmDialog({
      title: "Delete Tag",
      content: `Soft delete "${tag?.name}"? This keeps the tag for history but removes it from active use.`,
      okText: "Delete",
      cancelText: "Cancel",
      okVariant: "danger",
      onConfirm: async () => {
        if (isUsingMockData) {
          deleteMockTag(tag.id);
        } else {
          await deleteTag(tag.id);
          await refreshTags();
        }

        showOperationSucceeded("Tag deleted successfully.");
      },
    });
  }

  async function handleConfirmDialogOk() {
    if (!confirmDialog?.onConfirm) {
      return;
    }

    setLoading(true);
    try {
      await confirmDialog.onConfirm();
      closeConfirmDialog();
    } catch (error) {
      showOperationFailed(error);
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
                <h1 style={styles.title}>Tag Management</h1>
                <p style={styles.subtitle}>
                  Manage reusable tags for admin workflows. Tag deletion is always a soft delete and the page mirrors the
                  same experience as Category Management.
                </p>
              </div>
              <button type="button" onClick={openCreateModal} style={styles.primaryButton} disabled={loading}>
                + New Tag
              </button>
            </div>

            {/* Search + meta */}
            <div style={styles.toolbar}>
              <div style={styles.searchWrap}>
                <label htmlFor="tag-search" style={styles.srOnly}>
                  Search tags
                </label>
                <input
                  id="tag-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name…"
                  style={styles.searchInput}
                  disabled={loading}
                />
              </div>
              <div style={styles.metaPills}>
                <span style={styles.metaPill}>
                  Total: <strong style={styles.metaStrong}>{tags.length}</strong>
                </span>
                <span style={styles.metaPill}>
                  Showing: <strong style={styles.metaStrong}>{filteredTags.length}</strong>
                </span>
                {isUsingMockData ? (
                  <span style={{ ...styles.metaPill, ...styles.metaPillWarn }}>Mock mode</span>
                ) : null}
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
              <span style={styles.cardTitle}>Tags</span>
              {loading ? <span style={styles.loadingText}>Loading…</span> : null}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 110 }}>Tag ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={{ ...styles.th, width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={styles.emptyCell}>
                        No tags found.
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((tag) => (
                      <tr
                        key={tag.id}
                        style={styles.tr}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f7fcf9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                      >
                        <td style={styles.tdMono}>{tag.id}</td>
                        <td style={styles.td}>
                          <div style={styles.nameCell}>
                            <span style={styles.nameText}>{tag.name}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actions}>
                            <button
                              type="button"
                              style={styles.editBtn}
                              onClick={() => openEditModal(tag)}
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ ...styles.ghostButton, ...styles.ghostDanger }}
                              onClick={() => handleDelete(tag)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create / Edit modal */}
      {isModalOpen ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Tag form">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalKicker}>{modalMode === "create" ? "Create" : "Edit"} Tag</div>
                <div style={styles.modalTitle}>Details</div>
              </div>
              <button type="button" onClick={closeModal} style={styles.iconButton} aria-label="Close" disabled={loading}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="tag-name">
                  Name <span style={styles.req}>*</span>
                </label>
                <input
                  id="tag-name"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  style={{ ...styles.input, ...(formErrors.name ? styles.inputError : null) }}
                  placeholder="e.g., Accessibility"
                  disabled={loading}
                />
                {formErrors.name ? <div style={styles.fieldError}>{formErrors.name}</div> : null}
                <div style={styles.helpText}>Name must stay unique across all active tags.</div>
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

      {/* Confirm dialog (delete / restore) */}
      {confirmDialog ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={confirmDialog.title}>
          <div style={styles.confirmModal}>
            <div style={styles.confirmTitle}>{confirmDialog.title}</div>
            <p style={styles.confirmText}>{confirmDialog.content}</p>
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={closeConfirmDialog}
                style={styles.cancelButton}
                disabled={loading}
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirmDialogOk}
                style={
                  confirmDialog.okVariant === "danger"
                    ? { ...styles.ghostButton, ...styles.ghostDanger }
                    : styles.primaryButton
                }
                disabled={loading}
              >
                {confirmDialog.okText}
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
  metaPillWarn: {
    borderColor: "#fde68a",
    background: "#fef3c7",
    color: "#92400e",
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
    width: "min(560px, 100%)",
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

export default TagManagementPage;
