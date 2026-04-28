import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { approveApplication, getApplication, rejectApplication } from '../api/userApi';

const STATUS_STYLES = {
  PENDING: { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' },
  APPROVED: { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' },
  REJECTED: { background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' },
};

const MAX_REJECT_REASON = 1000;

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  return <span style={{ ...styles.badge, ...style }}>{status}</span>;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const loadApplication = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getApplication(id);
      setApplication(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this application? The user will become a Contributor.')) return;
    setActionLoading(true);
    try {
      await approveApplication(id);
      await loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectError('');
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError('Reject reason is required.');
      return;
    }
    if (trimmed.length > MAX_REJECT_REASON) {
      setRejectError(`Reject reason must not exceed ${MAX_REJECT_REASON} characters.`);
      return;
    }
    setActionLoading(true);
    try {
      await rejectApplication(id, trimmed);
      setRejectReason('');
      await loadApplication();
    } catch (err) {
      setRejectError(err.response?.data?.message || 'Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.page}><div style={styles.card}>Loading application…</div></div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/admin/users')}>← Back to applications</button>
        <div style={styles.errorBanner}>{error}</div>
      </div>
    );
  }

  const isPending = application?.status === 'PENDING';
  const files = application?.files || [];

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/admin/users')}>← Back to applications</button>

      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Contributor Application</p>
          <h1 style={styles.title}>Application #{application.id}</h1>
          <p style={styles.subtitle}>Review the applicant's reason and supporting materials before making a decision.</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div style={styles.grid}>
        <section style={{ ...styles.card, ...styles.gridCard }}>
          <h2 style={styles.sectionTitle}>Applicant</h2>
          <div style={styles.metaRow}><span style={styles.metaLabel}>User ID</span><span>{application.userId}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Username</span><span>{application.username || '—'}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Email</span><span>{application.email || '—'}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Applied At</span><span>{formatDate(application.appliedAt)}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Reviewed At</span><span>{formatDate(application.reviewedAt)}</span></div>
          <div style={styles.metaRow}><span style={styles.metaLabel}>Admin ID</span><span>{application.adminId || '—'}</span></div>
        </section>

        <section style={{ ...styles.card, ...styles.gridCard }}>
          <h2 style={styles.sectionTitle}>Review Decision</h2>
          {isPending ? (
            <>
              <button style={{ ...styles.primaryBtn, width: '100%' }} disabled={actionLoading} onClick={handleApprove}>
                {actionLoading ? 'Working…' : 'Approve Application'}
              </button>
              <div style={styles.rejectBox}>
                <label style={styles.label} htmlFor="rejectReason">Reject Reason <span style={styles.required}>*</span></label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={styles.textarea}
                  rows={6}
                  maxLength={MAX_REJECT_REASON}
                  placeholder="Explain why this contributor application is being rejected…"
                />
                <div style={styles.counterRow}>
                  <span style={styles.errorText}>{rejectError}</span>
                  <span style={styles.counter}>{rejectReason.length}/{MAX_REJECT_REASON}</span>
                </div>
                <button style={{ ...styles.rejectBtn, width: '100%' }} disabled={actionLoading} onClick={handleReject}>
                  {actionLoading ? 'Working…' : 'Reject Application'}
                </button>
              </div>
            </>
          ) : (
            <div style={styles.decisionSummary}>
              <p style={styles.muted}>This application has already been reviewed.</p>
              {application.status === 'REJECTED' && (
                <div style={styles.rejectReasonBox}>
                  <strong>Reject reason</strong>
                  <p>{application.rejectReason || '—'}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Application Reason</h2>
        <p style={styles.reasonText}>{application.reason || 'No reason provided.'}</p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Supporting Materials</h2>
        {files.length === 0 ? (
          <p style={styles.muted}>No supporting files were uploaded.</p>
        ) : (
          <div style={styles.fileGrid}>
            {files.map((file) => (
              <a key={file.id} href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.fileCard}>
                <span style={styles.fileIcon}>📎</span>
                <span style={styles.fileName}>{file.fileName}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 58px)',
    background: '#f4f7f5',
    padding: '36px 40px 72px',
    color: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
  },
  backBtn: {
    border: 'none',
    background: 'transparent',
    color: '#2d6a4f',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 18,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  eyebrow: {
    margin: 0,
    color: '#2d6a4f',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  title: { margin: '8px 0 6px', fontSize: 30, color: '#1a2e1f' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: 14 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: 20,
    alignItems: 'stretch',
    marginBottom: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #e8e3dc',
    borderRadius: 14,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    marginBottom: 20,
    minWidth: 0,
  },
  gridCard: {
    height: '100%',
    marginBottom: 0,
  },
  sectionTitle: {
    margin: '0 0 16px',
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  metaRow: {
    display: 'flex',
    padding: '10px 0',
    borderBottom: '1px solid #f5f1ec',
    gap: 18,
  },
  metaLabel: { width: 120, flexShrink: 0, color: '#6b7280', fontWeight: 700, fontSize: 13 },
  badge: {
    display: 'inline-flex',
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid',
    fontWeight: 800,
    fontSize: 12,
  },
  primaryBtn: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rejectBtn: {
    background: '#fff1f2',
    color: '#b91c1c',
    border: '1.5px solid #fca5a5',
    borderRadius: 10,
    padding: '12px 18px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rejectBox: { marginTop: 18, paddingTop: 18, borderTop: '1px solid #f5f1ec' },
  label: { display: 'block', marginBottom: 8, fontWeight: 700, color: '#374151', fontSize: 14 },
  required: { color: '#dc2626' },
  textarea: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical',
  },
  counterRow: { display: 'flex', justifyContent: 'space-between', gap: 12, margin: '6px 0 12px' },
  errorText: { color: '#b91c1c', fontSize: 12 },
  counter: { color: '#9ca3af', fontSize: 12 },
  reasonText: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    lineHeight: 1.75,
    color: '#374151',
    margin: 0,
    maxWidth: '100%',
  },
  muted: { color: '#9ca3af', margin: 0, lineHeight: 1.6 },
  decisionSummary: { color: '#4b5563' },
  rejectReasonBox: {
    marginTop: 14,
    padding: 14,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 10,
    color: '#7f1d1d',
    lineHeight: 1.6,
  },
  fileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  fileCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    textDecoration: 'none',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 14,
    background: '#fafafa',
  },
  fileIcon: { fontSize: 20, flexShrink: 0 },
  fileName: { fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'break-word', overflow: 'hidden', lineHeight: 1.4 },
  fileMeta: { color: '#9ca3af', fontSize: 12 },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 10,
    padding: 16,
    color: '#b91c1c',
  },
};
