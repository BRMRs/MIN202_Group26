import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../api/reviewApi';

/**
 * Reviewer Dashboard Page — Module C
 * PBI 3.1: List pending resources with status filters, chronological sorting
 * PBI 3.4: Show resubmission badge for PENDING_REVIEW items with prior rejections
 */

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'DRAFT', label: 'Draft' },
];

const STATUS_COLORS = {
  PENDING_REVIEW: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  APPROVED:       { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  REJECTED:       { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  UNPUBLISHED:    { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  ARCHIVED:       { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  DRAFT:          { bg: '#f9fafb', color: '#9ca3af', border: '#e5e7eb' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// PBI 3.4 — Audit Trail badge: shown when a PENDING_REVIEW item has been rejected before
function ResubmissionBadge({ rejectionCount }) {
  if (!rejectionCount || rejectionCount < 1) return null;
  return (
    <span
      title={`Previously rejected ${rejectionCount} time(s) — audit trail available on detail page`}
      style={{
        marginLeft: 6,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: '#fee2e2',
        color: '#b91c1c',
        border: '1px solid #fca5a5',
        verticalAlign: 'middle',
        cursor: 'default',
        whiteSpace: 'nowrap',
      }}
    >
      ↩ Resubmission ×{rejectionCount}
    </span>
  );
}

function ReviewerDashboardPage() {
  const navigate = useNavigate();

  const [resources, setResources]   = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Filters
  const [activeStatus, setActiveStatus] = useState('PENDING_REVIEW');
  const [sortDir, setSortDir]           = useState('desc');
  const [page, setPage]                 = useState(0);
  const PAGE_SIZE = 10;

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: PAGE_SIZE, sort: sortDir };
      if (activeStatus) params.status = activeStatus;
      const res = await getResources(params);
      const data = res.data.data;
      setResources(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalElements || 0);
    } catch (e) {
      setError('Failed to load resources. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, sortDir, page]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handleStatusChange = (val) => {
    setActiveStatus(val);
    setPage(0);
  };

  const handleSortToggle = () => {
    setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    setPage(0);
  };

  return (
    <div style={styles.page}>

          {/* Page header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.title}>Resource Review</h1>
            <p style={styles.subtitle}>
              Review submitted resources, approve or reject contributions, and manage publication status.
            </p>
          </div>

          {/* Testing mode notice — PBI 3.1 */}
          <div style={styles.testingNotice}>
            <strong>Testing Mode:</strong> Requests are sent as Admin (ID=1).
            Replace with JWT auth once Module A is complete.
          </div>

          {/* Filter + sort card */}
          <div style={styles.filterCard}>
            <div style={styles.filterRow}>
              <div style={styles.filterPills}>
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    style={{
                      ...styles.filterBtn,
                      ...(activeStatus === opt.value ? styles.filterBtnActive : {}),
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button onClick={handleSortToggle} style={styles.sortBtn}>
                {sortDir === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
              </button>
            </div>

            <div style={styles.counts}>
              {loading ? 'Loading…' : `${totalItems} resource(s) found`}
            </div>

            {error && (
              <div style={styles.errorBanner}>
                {error}
              </div>
            )}
          </div>

          {/* Table card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Resources</span>
              {loading && <span style={styles.loadingText}>Loading…</span>}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['#', 'Title', 'Contributor', 'Category', 'Status', 'Place', 'Created', 'Action'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={styles.emptyCell}>Loading resources…</td>
                    </tr>
                  ) : resources.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={styles.emptyCell}>
                        No resources found for this filter.
                      </td>
                    </tr>
                  ) : (
                    resources.map((r, idx) => (
                      <tr
                        key={r.id}
                        style={styles.tr}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f7fcf9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                      >
                        <td style={styles.tdMono}>
                          {page * PAGE_SIZE + idx + 1}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.titleCell}>
                            <div style={styles.titleText}>
                              {r.title}
                              {/* PBI 3.4 — show resubmission badge inline with title */}
                              <ResubmissionBadge rejectionCount={r.rejectionCount} />
                            </div>
                            {r.coverUrl && (
                              <img
                                src={r.coverUrl}
                                alt=""
                                style={styles.coverThumb}
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>{r.contributorName || '—'}</td>
                        <td style={styles.td}>{r.categoryName || '—'}</td>
                        <td style={styles.td}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ ...styles.td, color: '#9ca3af', fontSize: 13 }}>
                          {r.place || '—'}
                        </td>
                        <td style={{ ...styles.td, color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => navigate(`/reviews/${r.id}`)}
                            style={styles.reviewBtn}
                          >
                            Review →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ ...styles.pageBtn, ...(page === 0 ? styles.pageBtnDisabled : {}) }}
              >
                ← Prev
              </button>
              <span style={styles.pageInfo}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  ...styles.pageBtn,
                  ...(page >= totalPages - 1 ? styles.pageBtnDisabled : {}),
                }}
              >
                Next →
              </button>
            </div>
          )}

    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    maxWidth: 'none',
    margin: 0,
    padding: '36px 40px',
    minHeight: 'calc(100vh - 58px)',
    background: '#f4f7f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
    color: '#374151',
  },

  /* ── Page header ── */
  pageHeader: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#1a2e1f',
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 1.6,
  },

  /* ── Testing notice ── */
  testingNotice: {
    marginBottom: 16,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #fde68a',
    background: '#fef9c3',
    color: '#92400e',
    fontSize: 13,
    lineHeight: 1.5,
  },

  /* ── Filter card ── */
  filterCard: {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e8e3dc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    padding: '14px 20px',
    marginBottom: 16,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterPills: {
    display: 'flex',
    gap: 4,
    background: '#f9fafb',
    border: '1px solid #e8e3dc',
    borderRadius: 10,
    padding: '4px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.12s',
  },
  filterBtnActive: {
    background: '#2d6a4f',
    color: '#fff',
    fontWeight: 600,
  },
  sortBtn: {
    padding: '7px 14px',
    borderRadius: 9,
    border: '1.5px solid #2d6a4f',
    background: '#fff',
    color: '#2d6a4f',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  counts: {
    marginTop: 10,
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 500,
  },

  /* ── Error banner ── */
  errorBanner: {
    marginTop: 10,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #fca5a5',
    background: '#fef2f2',
    color: '#b91c1c',
    fontSize: 13,
    lineHeight: 1.5,
  },

  /* ── Table card ── */
  card: {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #e8e3dc',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #f0ebe2',
    background: '#fafaf8',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9ca3af',
  },
  loadingText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  /* ── Table ── */
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '11px 16px',
    color: '#6b7280',
    fontSize: 11,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    fontWeight: 700,
    borderBottom: '1px solid #f0ebe2',
    background: '#fafaf8',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f5f1ec',
    transition: 'background 120ms ease',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #f5f1ec',
    verticalAlign: 'middle',
    color: '#374151',
  },
  tdMono: {
    padding: '12px 16px',
    borderBottom: '1px solid #f5f1ec',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
    color: '#9ca3af',
    fontSize: 13,
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '48px 20px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 14,
  },
  titleCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  titleText: {
    fontWeight: 600,
    color: '#1a2e1f',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 220,
  },
  coverThumb: {
    width: 44,
    height: 32,
    objectFit: 'cover',
    borderRadius: 5,
    border: '1px solid #e8e3dc',
    display: 'block',
  },
  reviewBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #2d6a4f',
    background: '#2d6a4f',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  /* ── Pagination ── */
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  pageBtn: {
    padding: '7px 18px',
    borderRadius: 9,
    border: '1px solid #e8e3dc',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  pageBtnDisabled: {
    color: '#d1d5db',
    borderColor: '#f3f4f6',
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: 500,
  },
};

export default ReviewerDashboardPage;
