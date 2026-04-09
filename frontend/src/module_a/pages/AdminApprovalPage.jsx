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

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const approvedCount = applications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  const filtered =
    filterStatus === 'ALL'
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  return (
    <div style={styles.layout}>
      <AdminSidebar />
      <main style={styles.main}>
        <div style={styles.page}>
          {/* Hero panel */}
          <div style={styles.hero}>
            <div style={styles.heroTopRow}>
              <div>
                <h1 style={styles.title}>Contributor Applications</h1>
                <p style={styles.subtitle}>Review and manage contributor access requests.</p>
              </div>
            </div>

            {/* Summary stats */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{pendingCount}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{approvedCount}</div>
                <div style={styles.statLabel}>Approved</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{rejectedCount}</div>
                <div style={styles.statLabel}>Rejected</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{applications.length}</div>
                <div style={styles.statLabel}>Total</div>
              </div>
            </div>

            {/* Status filter */}
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
              <span style={styles.metaPill}>
                {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}
          </div>

          {/* Table card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Applications</h2>
              {loading && <span style={styles.loadingText}>Loading...</span>}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 60 }}>ID</th>
                    <th style={styles.th}>User ID</th>
                    <th style={styles.th}>Applied At</th>
                    <th style={{ ...styles.th, width: 130 }}>Status</th>
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
                      <tr key={app.id} style={styles.tr}>
                        <td style={styles.tdMono}>{app.id}</td>
                        <td style={styles.td}>{app.userId}</td>
                        <td style={styles.td}>
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleString() : '-'}
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
  layout: {
    minHeight: '100vh',
    background:
      'radial-gradient(1200px 600px at 20% 0%, rgba(255, 233, 210, 0.8), transparent 55%), radial-gradient(900px 500px at 85% 10%, rgba(210, 235, 255, 0.75), transparent 52%), #0b0d12',
    display: 'flex',
  },
  main: {
    marginLeft: 260,
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
  },
  page: {
    maxWidth: 1080,
    margin: '0 auto',
    color: '#eaf0ff',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  },
  hero: {
    marginBottom: 18,
    padding: '18px 18px 14px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
  },
  heroTopRow: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 30,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  subtitle: {
    margin: '10px 0 0',
    color: 'rgba(234,240,255,0.78)',
    fontSize: 14,
    lineHeight: 1.6,
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    padding: '12px 18px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.18)',
    minWidth: 90,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#ffffff',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(234,240,255,0.55)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '7px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.20)',
    color: 'rgba(234,240,255,0.72)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'rgba(120, 170, 255, 0.18)',
    borderColor: 'rgba(120, 170, 255, 0.40)',
    color: '#ffffff',
  },
  metaPill: {
    padding: '7px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.18)',
    color: 'rgba(234,240,255,0.72)',
    fontSize: 12,
    fontWeight: 600,
  },
  errorBanner: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255, 107, 107, 0.35)',
    background: 'rgba(255, 107, 107, 0.12)',
    color: '#ffecec',
    fontSize: 13,
    lineHeight: 1.5,
  },
  card: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.22)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
  },
  cardTitle: {
    margin: 0,
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(234,240,255,0.78)',
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(234,240,255,0.65)',
  },
  tableWrap: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'rgba(234,240,255,0.65)',
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.02)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    verticalAlign: 'middle',
    color: 'rgba(234,240,255,0.85)',
  },
  tdMono: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    color: 'rgba(234,240,255,0.65)',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '36px 16px',
    color: 'rgba(234,240,255,0.45)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    border: '1px solid transparent',
  },
  badgePending: {
    background: 'rgba(255, 196, 72, 0.12)',
    color: 'rgba(255, 224, 140, 0.95)',
    borderColor: 'rgba(255, 196, 72, 0.28)',
  },
  badgeApproved: {
    background: 'rgba(72, 255, 171, 0.12)',
    color: 'rgba(162, 255, 210, 0.95)',
    borderColor: 'rgba(72, 255, 171, 0.22)',
  },
  badgeRejected: {
    background: 'rgba(255, 107, 107, 0.12)',
    color: 'rgba(255, 180, 180, 0.95)',
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    padding: '7px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  approveBtn: {
    background: 'rgba(72, 255, 171, 0.10)',
    color: 'rgba(162, 255, 210, 0.95)',
    borderColor: 'rgba(72, 255, 171, 0.25)',
  },
  rejectBtn: {
    background: 'rgba(255, 107, 107, 0.10)',
    color: 'rgba(255, 180, 180, 0.95)',
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  actionBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default AdminApprovalPage;
