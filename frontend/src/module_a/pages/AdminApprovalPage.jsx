import { useState, useEffect } from 'react';
import { getApplications, approveApplication, rejectApplication } from '../api/userApi';
import { AdminSidebar } from '../../module_e/components';

function AdminApprovalPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchApplications = () => {
    setLoading(true);
    getApplications()
      .then((res) => setApplications(res.data.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this application? The user will become a Contributor.')) return;
    setActionLoading(id);
    try {
      await approveApplication(id);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    setActionLoading(id);
    try {
      await rejectApplication(id);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount  = applications.filter((a) => a.status === 'PENDING').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  const filtered =
    filterStatus === 'ALL'
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const statCards = [
    { value: pendingCount,        label: 'Pending',  color: '#b45309' },
    { value: approvedCount,       label: 'Approved', color: '#166534' },
    { value: rejectedCount,       label: 'Rejected', color: '#b91c1c' },
    { value: applications.length, label: 'Total',    color: '#374151' },
  ];

  return (
    <div style={styles.layout}>
      <AdminSidebar />

      <main style={styles.main}>
        <div style={styles.page}>

          {/* Page header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.title}>Contributor Applications</h1>
            <p style={styles.subtitle}>Review and manage contributor access requests.</p>
          </div>

          {/* Summary stats */}
          <div style={styles.statsRow}>
            {statCards.map(({ value, label, color }) => (
              <div key={label} style={styles.statCard}>
                <div style={{ ...styles.statValue, color }}>{value}</div>
                <div style={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs + record count */}
          <div style={styles.toolbar}>
            <div style={styles.filterGroup}>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  style={{
                    ...styles.filterBtn,
                    ...(filterStatus === status ? styles.filterBtnActive : {}),
                  }}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <span style={styles.recordCount}>
              {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}

          {/* Table card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Applications</span>
              {loading && <span style={styles.loadingText}>Loading…</span>}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 64 }}>ID</th>
                    <th style={styles.th}>User ID</th>
                    <th style={styles.th}>Applied At</th>
                    <th style={{ ...styles.th, width: 120 }}>Status</th>
                    <th style={{ ...styles.th, width: 180 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={styles.emptyCell}>
                        {filterStatus === 'ALL'
                          ? 'No applications found.'
                          : `No ${filterStatus.toLowerCase()} applications.`}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app) => (
                      <tr
                        key={app.id}
                        style={styles.tr}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f7fcf9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                      >
                        <td style={styles.tdMono}>{app.id}</td>
                        <td style={styles.td}>{app.userId}</td>
                        <td style={styles.td}>
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleString() : '—'}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...(app.status === 'PENDING'
                                ? styles.badgePending
                                : app.status === 'APPROVED'
                                ? styles.badgeApproved
                                : styles.badgeRejected),
                            }}
                          >
                            {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actions}>
                            {app.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  disabled={actionLoading === app.id}
                                  style={{
                                    ...styles.actionBtn,
                                    ...styles.approveBtn,
                                    ...(actionLoading === app.id ? styles.actionBtnDisabled : {}),
                                  }}
                                >
                                  {actionLoading === app.id ? '…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleReject(app.id)}
                                  disabled={actionLoading === app.id}
                                  style={{
                                    ...styles.actionBtn,
                                    ...styles.rejectBtn,
                                    ...(actionLoading === app.id ? styles.actionBtnDisabled : {}),
                                  }}
                                >
                                  {actionLoading === app.id ? '…' : 'Reject'}
                                </button>
                              </>
                            )}
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
    </div>
  );
}

const styles = {
  /* ── Layout shell ── */
  layout: {
    minHeight: '100vh',
    background: '#f4f7f5',
    display: 'flex',
  },
  main: {
    marginLeft: 260,
    flex: 1,
    padding: '36px 40px',
    minHeight: '100vh',
  },
  page: {
    maxWidth: 1020,
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
  },

  /* ── Page header ── */
  pageHeader: {
    marginBottom: 24,
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

  /* ── Summary stat cards ── */
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    background: '#fff',
    border: '1px solid #e8e3dc',
    borderRadius: 12,
    padding: '14px 22px',
    minWidth: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },

  /* ── Filter toolbar ── */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    gap: 3,
    background: '#fff',
    border: '1px solid #e8e3dc',
    borderRadius: 10,
    padding: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: 7,
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1.4,
  },
  filterBtnActive: {
    background: '#2d6a4f',
    color: '#fff',
  },
  recordCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
  },

  /* ── Error banner ── */
  errorBanner: {
    marginBottom: 14,
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
    padding: '11px 20px',
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
    padding: '13px 20px',
    borderBottom: '1px solid #f5f1ec',
    verticalAlign: 'middle',
    color: '#374151',
  },
  tdMono: {
    padding: '13px 20px',
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

  /* ── Status badges ── */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.03em',
    border: '1px solid transparent',
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e',
    borderColor: '#fde68a',
  },
  badgeApproved: {
    background: '#dcfce7',
    color: '#166534',
    borderColor: '#bbf7d0',
  },
  badgeRejected: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderColor: '#fca5a5',
  },

  /* ── Action buttons ── */
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1.5px solid transparent',
  },
  approveBtn: {
    background: '#f0fdf4',
    color: '#166534',
    borderColor: '#86efac',
  },
  rejectBtn: {
    background: '#fff1f2',
    color: '#b91c1c',
    borderColor: '#fca5a5',
  },
  actionBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default AdminApprovalPage;
