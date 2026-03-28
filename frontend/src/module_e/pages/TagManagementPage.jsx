import React, { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/module_e/components";
import { createTag, deleteTag, getTags, updateTag } from "@/module_e/api/tagApi";

const INITIAL_MOCK_TAGS = [
  {
    id: 2001,
    name: "Architecture",
    description: "System design and frontend structure guidance.",
  },
  {
    id: 2002,
    name: "Accessibility",
    description: "Inclusive UX, semantic HTML, and keyboard-first interactions.",
  },
  {
    id: 2003,
    name: "Performance",
    description: "Rendering, bundle size, and responsive interface optimization.",
  },
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
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

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
      const description = String(tag?.description ?? "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [tags, search]);

  function openCreateModal() {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("create");
    setEditingId(null);
    setForm({ name: "", description: "" });
    setIsModalOpen(true);
  }

  function openEditModal(tag) {
    setErrorMessage("");
    setFormErrors({});
    setModalMode("edit");
    setEditingId(tag?.id ?? null);
    setForm({
      name: String(tag?.name ?? ""),
      description: String(tag?.description ?? ""),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setFormErrors({});
    setEditingId(null);
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
    const newTag = {
      id: nextId,
      name: nextForm.name,
      description: nextForm.description,
    };

    setTags((previous) => [newTag, ...previous]);
  }

  function updateMockTag(nextForm) {
    setTags((previous) =>
      previous.map((tag) =>
        tag.id === editingId
          ? {
              ...tag,
              name: nextForm.name,
              description: nextForm.description,
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
      description: String(form?.description ?? "").trim(),
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
        } else {
          await createTag(nextForm);
          await refreshTags();
        }
      } else if (isUsingMockData) {
        updateMockTag(nextForm);
      } else {
        await updateTag(editingId, nextForm);
        await refreshTags();
      }

      closeModal();
    } catch (error) {
      setErrorMessage(error?.message || "Failed to save tag.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tag) {
    const confirmed = window.confirm(
      `Soft delete "${tag?.name}"?\n\nThis keeps the tag for history but removes it from active use.`
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      if (isUsingMockData) {
        deleteMockTag(tag.id);
      } else {
        await deleteTag(tag.id);
        await refreshTags();
      }
    } catch (error) {
      setErrorMessage(error?.message || "Failed to delete tag.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" style={styles.layout}>
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={styles.main}>
        <div style={styles.page}>
          <div style={styles.hero}>
            <div style={styles.heroTopRow}>
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

            <div style={styles.toolbar}>
              <div style={styles.searchWrap}>
                <label htmlFor="tag-search" style={styles.srOnly}>
                  Search tags
                </label>
                <input
                  id="tag-search"
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
                  Total: <strong style={styles.metaStrong}>{tags.length}</strong>
                </span>
                <span style={styles.metaPill}>
                  Showing: <strong style={styles.metaStrong}>{filteredTags.length}</strong>
                </span>
                {isUsingMockData ? <span style={styles.metaPill}>Mock mode</span> : null}
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
              <h2 style={styles.cardTitle}>Tags</h2>
              {loading ? <span style={styles.loadingText}>Loading...</span> : null}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 110 }}>Tag ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Description</th>
                    <th style={{ ...styles.th, width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredTags.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.emptyCell}>
                        No tags found.
                      </td>
                    </tr>
                  ) : (
                    filteredTags.map((tag) => (
                      <tr key={tag.id} style={styles.tr}>
                        <td style={styles.tdMono}>{tag.id}</td>
                        <td style={styles.td}>
                          <div style={styles.nameCell}>
                            <span style={styles.nameText}>{tag.name}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span title={tag.description || ""} style={styles.descText}>
                            {tag.description || <span style={styles.muted}>No description</span>}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actions}>
                            <button
                              type="button"
                              style={styles.secondaryButton}
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

      {isModalOpen ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Tag form">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalKicker}>{modalMode === "create" ? "Create" : "Edit"} Tag</div>
                <div style={styles.modalTitle}>Details</div>
              </div>
              <button type="button" onClick={closeModal} style={styles.iconButton} aria-label="Close" disabled={loading}>
                X
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

              <div style={styles.formRow}>
                <label style={styles.label} htmlFor="tag-description">
                  Description
                </label>
                <textarea
                  id="tag-description"
                  value={form.description}
                  onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                  style={styles.textarea}
                  placeholder="Optional short description"
                  rows={4}
                  disabled={loading}
                />
                <div style={styles.helpText}>Description helps admins understand where this tag should be applied.</div>
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

export default TagManagementPage;
