import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../api/reviewApi';

// PBI 3.1 — Task: Design resource management list UI with status filters (#26)
// PBI 3.4 — Task: Ensure the Review Queue automatically includes resubmitted items
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
  PENDING_REVIEW: { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
  APPROVED:       { bg: '#d1e7dd', color: '#0a3622', border: '#198754' },
  REJECTED:       { bg: '#f8d7da', color: '#58151c', border: '#dc3545' },
  UNPUBLISHED:    { bg: '#cfe2ff', color: '#052c65', border: '#0d6efd' },
  ARCHIVED:       { bg: '#e2e3e5', color: '#383d41', border: '#6c757d' },
  DRAFT:          { bg: '#f0f0f0', color: '#555',    border: '#aaa' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
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
    <span title={`Previously rejected ${rejectionCount} time(s) — audit trail available on detail page`}
      style={{
        marginLeft: 6, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
        background: '#fff0f0', color: '#c0392b', border: '1px solid #e74c3c',
        verticalAlign: 'middle', cursor: 'default', whiteSpace: 'nowrap',
      }}>
      ↩ Resubmission ×{rejectionCount}
    </span>
  );
}

function ReviewerDashboardPage() {
  const navigate = useNavigate();

  const [resources, setResources]     = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalItems, setTotalItems]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

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
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#2d6a4f', color: 'white', padding: '20px 32px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>📋 Resource Review Dashboard</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 14 }}>
          PBI 3.1 + PBI 3.4 — Module C · Heritage Platform Admin
        </p>
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* Testing notice */}
        <div style={{ background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 8,
          padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#7a5800' }}>
          ⚠️ <strong>Testing Mode:</strong> Requests are sent as Admin (ID=1).
          Replace with JWT auth once Module A is complete.
        </div>

        {/* Filter + Sort bar */}
        <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>

          <span style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>Status:</span>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: activeStatus === opt.value ? '#2d6a4f' : '#d0d0d0',
                  background: activeStatus === opt.value ? '#2d6a4f' : 'white',
                  color: activeStatus === opt.value ? 'white' : '#444',
                  fontWeight: activeStatus === opt.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={handleSortToggle}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: '1.5px solid #2d6a4f', background: 'white', color: '#2d6a4f',
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {sortDir === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
            </button>
          </div>
        </div>

        {/* Result count */}
        <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
          {loading ? 'Loading…' : `${totalItems} resource(s) found`}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#f8d7da', border: '1px solid #dc3545', borderRadius: 8,
            padding: '12px 16px', color: '#58151c', marginBottom: 16, fontSize: 14 }}>
            ❌ {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f0f4f2', borderBottom: '2px solid #e0e8e4' }}>
                {['#', 'Title', 'Contributor', 'Category', 'Status', 'Place', 'Created', 'Action']
                  .map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                      fontWeight: 600, color: '#2d6a4f', fontSize: 13 }}>
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  Loading resources…
                </td></tr>
              ) : resources.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  No resources found for this filter.
                </td></tr>
              ) : (
                resources.map((r, idx) => (
                  <tr key={r.id}
                    style={{ borderBottom: '1px solid #f0f0f0',
                      background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', color: '#999', fontSize: 12 }}>
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a1a', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                        {/* PBI 3.4 — show resubmission badge inline with title */}
                        <ResubmissionBadge rejectionCount={r.rejectionCount} />
                      </div>
                      {r.coverUrl && (
                        <img src={r.coverUrl} alt=""
                          style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 4,
                            marginTop: 4, display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      {r.contributorName}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      {r.categoryName}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: '12px 16px', color: '#777', fontSize: 13 }}>
                      {r.place}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#777', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => navigate(`/reviews/${r.id}`)}
                        style={{ padding: '5px 14px', borderRadius: 6, fontSize: 13,
                          background: '#2d6a4f', color: 'white', border: 'none',
                          cursor: 'pointer', fontWeight: 600 }}>
                        Review →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, marginTop: 20 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '7px 18px', borderRadius: 8, border: '1.5px solid #ccc',
                cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'white',
                color: page === 0 ? '#bbb' : '#333', fontWeight: 600 }}>
              ← Prev
            </button>
            <span style={{ fontSize: 14, color: '#555' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '7px 18px', borderRadius: 8, border: '1.5px solid #ccc',
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                background: 'white', color: page >= totalPages - 1 ? '#bbb' : '#333',
                fontWeight: 600 }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewerDashboardPage;
