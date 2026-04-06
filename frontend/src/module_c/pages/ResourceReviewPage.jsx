/**
 * Resource Review Page — Module C
 * PBI 3.1: Detailed view, metadata, media preview, "Not provided" placeholders
 * PBI 3.2: Approve/Reject/Unpublish/Republish/Archive actions, access control, toast notifications
 * PBI 3.4: Contributor resubmit (REJECTED→PENDING_REVIEW), prominent audit trail for resubmissions
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getResourceDetail,
  approveResource,
  rejectResource,
  archiveResource,
  unpublishResource,
  republishResource,
  resubmitResource,
  getReviewHistory,
} from '../api/reviewApi';

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
    <span style={{ padding: '4px 14px', borderRadius: 14, fontSize: 13, fontWeight: 700,
      background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function MetaRow({ label, value }) {
  const display = (!value || value === 'Not provided') ? null : value;
  return (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ width: 180, flexShrink: 0, color: '#666', fontSize: 13, fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ color: display ? '#1a1a1a' : '#bbb', fontSize: 14, fontStyle: display ? 'normal' : 'italic' }}>
        {display || 'Not provided'}
      </span>
    </div>
  );
}

function ResourceReviewPage() {
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [resource, setResource]   = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // PBI 3.2 — Task: UI notification for successful status change
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // Reject modal state
  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [rejectFeedback, setRejectFeedback]     = useState('');
  const [selectedTemplate, setSelectedTemplate]   = useState('');

  // Rejection templates
  const REJECTION_TEMPLATES = [
    { id: 'insufficient', label: 'Insufficient Evidence', text: 'The submitted content lacks sufficient historical evidence or source citations to verify the claims made.' },
    { id: 'poor_quality', label: 'Poor Content Quality', text: 'The content does not meet our quality standards. Please improve clarity, organization, and detail.' },
    { id: 'duplicate', label: 'Duplicate Content', text: 'Similar content already exists on the platform. Please review existing entries before resubmitting.' },
    { id: 'inappropriate', label: 'Inappropriate Content', text: 'The submitted content contains material that is not appropriate for our heritage platform.' },
    { id: 'incomplete', label: 'Incomplete Submission', text: 'The submission is missing required fields or essential information. Please complete all sections.' },
  ];

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason]       = useState('');

  // Unpublish modal state
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [unpublishReason, setUnpublishReason]       = useState('');

  // Republish modal state
  const [showRepublishModal, setShowRepublishModal] = useState(false);
  const [republishFeedback, setRepublishFeedback]   = useState('');
  const [republishConfirmed, setRepublishConfirmed]  = useState(false);

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveFeedback, setApproveFeedback]   = useState('');

  // Media full-size preview
  const [previewMedia, setPreviewMedia] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailRes, historyRes] = await Promise.all([
        getResourceDetail(resourceId),
        getReviewHistory(resourceId),
      ]);
      setResource(detailRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('no longer available')) {
        setError('⚠️ Resource no longer available.');
      } else if (err.response?.status === 403) {
        setError('⚠️ Resource no longer available.');
      } else {
        setError('Failed to load resource. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [resourceId]);

  const handleApprove = async () => {
    try {
      await approveResource(resourceId, approveFeedback);
      showToast('✅ Resource approved successfully.');
      setShowApproveModal(false);
      setApproveFeedback('');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Approval failed.', 'error');
    }
  };

  const openApproveModal = () => setShowApproveModal(true);

  const handleReject = async () => {
    if (!rejectFeedback.trim()) return;
    try {
      await rejectResource(resourceId, rejectFeedback);
      showToast('Resource rejected.');
      setShowRejectModal(false);
      setRejectFeedback('');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Rejection failed.', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveResource(resourceId, archiveReason);
      showToast('📦 Resource archived.');
      setShowArchiveModal(false);
      setArchiveReason('');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Archive failed.', 'error');
    }
  };

  // PBI 3.2 — Unpublish / Republish handlers (with modals)
  const handleUnpublish = async () => {
    if (!unpublishReason.trim()) return;
    if (unpublishReason.trim().split(/\s+/).length > 500) {
      showToast('Unpublish reason must not exceed 500 words.', 'error');
      return;
    }
    try {
      await unpublishResource(resourceId, unpublishReason);
      showToast('📥 Resource unpublished.');
      setShowUnpublishModal(false);
      setUnpublishReason('');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Unpublish failed.', 'error');
    }
  };

  const handleRepublish = async () => {
    try {
      await republishResource(resourceId, republishFeedback);
      showToast('✅ Resource republished.');
      setShowRepublishModal(false);
      setRepublishFeedback('');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Republish failed.', 'error');
    }
  };

  // PBI 3.4 — Contributor resubmits a REJECTED resource; uses resource's contributorId for testing
  const handleResubmit = async () => {
    if (!r?.contributorId) return;
    try {
      await resubmitResource(resourceId, r.contributorId);
      showToast('↩ Resource resubmitted for review — it will now appear in the review queue.');
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Resubmit failed.', 'error');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '60vh', color: '#2d6a4f', fontSize: 18 }}>
      Loading resource…
    </div>
  );

  if (error) return (
    <div style={{ padding: 32 }}>
      <div style={{ background: '#f8d7da', border: '1px solid #dc3545', borderRadius: 8,
        padding: 16, color: '#58151c' }}>{error}</div>
    </div>
  );

  const r = resource;
  // PBI 3.2 — Task: "Implement access control: hide decision buttons for non-pending items"
  const isPending    = r?.status === 'PENDING_REVIEW';
  const canUnpublish = r?.status === 'APPROVED';
  const canRepublish = r?.status === 'UNPUBLISHED';
  const canArchive   = r?.status === 'APPROVED' || r?.status === 'UNPUBLISHED';
  // PBI 3.4 — Only the contributor's REJECTED resource can be resubmitted
  const canResubmit  = r?.status === 'REJECTED';
  // PBI 3.4 — Detect resubmission: PENDING_REVIEW item that has prior REJECTED decisions in its history
  const priorRejections = history.filter(fb => fb.decision === 'REJECTED');
  const isResubmission  = isPending && priorRejections.length > 0;
  const coverMedia   = r?.mediaFiles?.find(m => m.mediaType === 'COVER');
  const otherMedia   = r?.mediaFiles?.filter(m => m.mediaType !== 'COVER') || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: 'system-ui, sans-serif' }}>

      {/* PBI 3.2 — Toast notification stack (auto-dismisses after 3.5s) */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            background: t.type === 'error' ? '#f8d7da' : '#d1e7dd',
            color:      t.type === 'error' ? '#58151c' : '#0a3622',
            border:     `1px solid ${t.type === 'error' ? '#dc3545' : '#198754'}`,
            animation: 'fadeIn 0.2s ease',
            minWidth: 220,
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ background: '#2d6a4f', color: 'white', padding: '16px 32px',
        display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/reviews')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          ← Dashboard
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{r?.title}</h1>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={r?.status} />
            {r?.status === 'ARCHIVED' && (
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: '#6c757d', color: 'white' }}>
                ARCHIVED
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* PBI 3.4 — Audit Trail Banner: visible when reviewing a resubmitted resource */}
        {isResubmission && (
          <div style={{ background: '#fff3cd', border: '1.5px solid #f0c040', borderRadius: 10,
            padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22 }}>↩</span>
            <div>
              <div style={{ fontWeight: 700, color: '#7a5800', fontSize: 15, marginBottom: 4 }}>
                Resubmission — previously rejected {priorRejections.length} time(s)
              </div>
              <div style={{ fontSize: 13, color: '#856404' }}>
                The contributor revised and resubmitted this resource. Review the audit trail below
                to compare changes against previous rejection feedback before making a decision.
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {priorRejections.map(fb => (
                  <div key={fb.id} style={{ fontSize: 12, padding: '8px 12px', background: '#fff8e1',
                    borderLeft: '3px solid #f0c040', borderRadius: 4, color: '#5a4000' }}>
                    <strong>{fb.reviewerName}</strong> rejected on {fb.reviewedAt ? new Date(fb.reviewedAt).toLocaleDateString() : '—'}
                    {fb.feedbackText && <> — "{fb.feedbackText}"</>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons — PBI 3.2: hidden for non-actionable statuses */}
        {(isPending || canArchive || canUnpublish || canRepublish || canResubmit) && !r?.status?.includes('ARCHIVED') && (
          <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20,
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 600, color: '#333', fontSize: 14 }}>Actions:</span>
            {isPending && (
              <>
                <button onClick={openApproveModal}
                  style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                    background: '#198754', color: 'white', fontWeight: 700,
                    cursor: 'pointer', fontSize: 14 }}>
                  ✅ Approve
                </button>
                <button onClick={() => setShowRejectModal(true)}
                  style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                    background: '#dc3545', color: 'white', fontWeight: 700,
                    cursor: 'pointer', fontSize: 14 }}>
                  ❌ Reject
                </button>
              </>
            )}
            {canUnpublish && (
              <button onClick={() => setShowUnpublishModal(true)}
                style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                  background: '#0d6efd', color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: 14 }}>
                📥 Unpublish
              </button>
            )}
            {canRepublish && (
              <button onClick={() => setShowRepublishModal(true)}
                style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                  background: '#198754', color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: 14 }}>
                🔄 Republish
              </button>
            )}
            {canArchive && (
              <button onClick={() => setShowArchiveModal(true)}
                style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                  background: '#6c757d', color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: 14 }}>
                📦 Archive
              </button>
            )}
            {/* PBI 3.4 — Resubmit: contributor action; uses resource's contributorId (testing) */}
            {canResubmit && (
              <button onClick={handleResubmit}
                style={{ padding: '8px 22px', borderRadius: 8, border: 'none',
                  background: '#fd7e14', color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: 14 }}
                title="Simulate contributor resubmission (sends X-User-Id = contributor's ID)">
                ↩ Resubmit (Contributor)
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

          {/* Left: Metadata */}
          <div>
            <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                📄 Resource Information
              </h2>
              <MetaRow label="Title"           value={r?.title} />
              <MetaRow label="Contributor"     value={r?.contributorName} />
              <MetaRow label="Category"        value={r?.categoryName} />
              <MetaRow label="Place"           value={r?.place} />
              <MetaRow label="Status"          value={r?.status} />
              <MetaRow label="Created"         value={r?.createdAt ? new Date(r.createdAt).toLocaleString() : null} />
              <MetaRow label="Last Updated"    value={r?.updatedAt ? new Date(r.updatedAt).toLocaleString() : null} />
              <MetaRow label="Comment Count"   value={String(r?.commentCount ?? 0)} />
              <MetaRow label="Like Count"      value={String(r?.likeCount ?? 0)} />
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                📝 Description
              </h2>
              <p style={{ color: r?.description === 'Not provided' ? '#bbb' : '#333',
                fontStyle: r?.description === 'Not provided' ? 'italic' : 'normal',
                lineHeight: 1.7, margin: 0 }}>
                {r?.description || 'Not provided'}
              </p>
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                ⚖️ Copyright &amp; Links
              </h2>
              <MetaRow label="Copyright"       value={r?.copyrightDeclaration} />
              <MetaRow label="External Link"   value={r?.externalLink} />
              <MetaRow label="Archive Reason"  value={r?.archiveReason} />
            </div>

            {/* New category request section */}
            {(r?.requestedCategoryName && r.requestedCategoryName !== 'Not provided') && (
              <div style={{ background: '#fff8e1', border: '1px solid #f0c040', borderRadius: 10,
                padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#7a5800', fontWeight: 700 }}>
                  🆕 New Category Request
                </h2>
                <MetaRow label="Requested Name"  value={r?.requestedCategoryName} />
                <MetaRow label="Reason"          value={r?.categoryRequestReason} />
              </div>
            )}
          </div>

          {/* Right: Media */}
          <div>
            {/* Cover image */}
            <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                🖼️ Cover Image
              </h2>
              {coverMedia ? (
                <img src={coverMedia.fileUrl} alt="Cover"
                  onClick={() => setPreviewMedia(coverMedia)}
                  style={{ width: '100%', borderRadius: 8, cursor: 'zoom-in',
                    objectFit: 'cover', maxHeight: 220, display: 'block' }}
                  onError={e => { e.target.src = ''; e.target.style.display = 'none'; }} />
              ) : (
                <div style={{ height: 120, background: '#f0f0f0', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#bbb', fontSize: 13, fontStyle: 'italic' }}>
                  No cover image
                </div>
              )}
            </div>

            {/* Other media files */}
            {otherMedia.length > 0 && (
              <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 14px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                  📎 Media Files
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {otherMedia.map(m => (
                    <div key={m.id} onClick={() => setPreviewMedia(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10,
                        padding: 10, borderRadius: 8, border: '1px solid #eee',
                        cursor: 'pointer', background: '#fafafa' }}>
                      <span style={{ fontSize: 22 }}>
                        {m.mediaType === 'VIDEO' ? '🎥' :
                         m.mediaType === 'AUDIO' ? '🎵' :
                         m.mediaType === 'DOCUMENT' ? '📄' : '🖼️'}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {m.fileName || 'Unnamed file'}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          {m.mediaType} · {m.mimeType || 'unknown type'}
                          {m.fileSize ? ` · ${(m.fileSize / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#2d6a4f', fontWeight: 600 }}>
                        View →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest feedback */}
            {r?.latestFeedback && (
              <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
                  💬 Latest Review
                </h2>
                <div style={{ fontSize: 13, color: '#555' }}>
                  <div><strong>Decision:</strong> <StatusBadge status={r.latestFeedback.decision} /></div>
                  <div style={{ marginTop: 8 }}><strong>By:</strong> {r.latestFeedback.reviewerName}</div>
                  <div style={{ marginTop: 8 }}><strong>At:</strong> {r.latestFeedback.reviewedAt ? new Date(r.latestFeedback.reviewedAt).toLocaleString() : '—'}</div>
                  {r.latestFeedback.feedbackText && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#f8f8f8',
                      borderLeft: '3px solid #2d6a4f', borderRadius: 4, lineHeight: 1.6 }}>
                      {r.latestFeedback.feedbackText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PBI 3.4 — Review History / Audit Trail */}
        {history.length > 0 && (
          <div style={{ background: 'white', borderRadius: 10, padding: '20px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: 4 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#2d6a4f', fontWeight: 700 }}>
              🕐 Audit Trail — Review History
              {priorRejections.length > 0 && (
                <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 10, background: '#fff0f0', color: '#c0392b',
                  border: '1px solid #e74c3c' }}>
                  {priorRejections.length} rejection(s) on record
                </span>
              )}
            </h2>
            {history.map((fb, i) => {
              const isRejected = fb.decision === 'REJECTED';
              return (
                <div key={fb.id} style={{ display: 'flex', gap: 14,
                  marginBottom: i < history.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', marginTop: 4,
                      background: isRejected ? '#dc3545' : '#2d6a4f' }} />
                    {i < history.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#d0e8d8', marginTop: 2 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8,
                    background: isRejected ? '#fff5f5' : 'transparent',
                    borderRadius: isRejected ? 8 : 0,
                    padding: isRejected ? '8px 12px' : '0 0 8px 0',
                    border: isRejected ? '1px solid #f8d7da' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <StatusBadge status={fb.decision} />
                      <span style={{ fontSize: 12, color: '#888' }}>
                        by {fb.reviewerName} · {fb.reviewedAt ? new Date(fb.reviewedAt).toLocaleString() : '—'}
                      </span>
                    </div>
                    {fb.feedbackText && (
                      <div style={{ fontSize: 13, color: '#555', padding: '8px 12px',
                        background: isRejected ? '#fff0f0' : '#f8f8f8',
                        borderRadius: 6, lineHeight: 1.6,
                        borderLeft: `3px solid ${isRejected ? '#dc3545' : '#2d6a4f'}` }}>
                        {fb.feedbackText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#dc3545' }}>❌ Reject Resource</h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              Feedback is <strong>mandatory</strong> when rejecting. The contributor will see this message.
            </p>
            <select
              value={selectedTemplate}
              onChange={e => {
                const tpl = REJECTION_TEMPLATES.find(t => t.id === e.target.value);
                setSelectedTemplate(e.target.value);
                if (tpl) setRejectFeedback(tpl.text);
              }}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            >
              <option value="">-- Select a template (optional) --</option>
              {REJECTION_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <textarea
              value={rejectFeedback}
              onChange={e => { setRejectFeedback(e.target.value); setSelectedTemplate(''); }}
              placeholder="Explain why this resource is being rejected…"
              rows={4}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                borderColor: rejectFeedback.trim() ? '#ccc' : '#dc3545' }}
            />
            {rejectFeedback.trim() && (
              <p style={{ color: rejectFeedback.trim().split(/\s+/).length > 500 ? '#dc3545' : '#666', fontSize: 12, margin: '4px 0 0', textAlign: 'right' }}>
                {rejectFeedback.trim().split(/\s+/).length} / 500 words
              </p>
            )}
            {!rejectFeedback.trim() && (
              <p style={{ color: '#dc3545', fontSize: 12, margin: '4px 0 0' }}>
                Feedback is required.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowRejectModal(false); setRejectFeedback(''); setSelectedTemplate(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #ccc',
                  background: 'white', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={!rejectFeedback.trim() || rejectFeedback.trim().split(/\s+/).length > 500}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: rejectFeedback.trim() && rejectFeedback.trim().split(/\s+/).length <= 500 ? '#dc3545' : '#ccc',
                  color: 'white', cursor: rejectFeedback.trim() && rejectFeedback.trim().split(/\s+/).length <= 500 ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: 14 }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {showArchiveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 480,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#6c757d' }}>📦 Archive Resource</h3>
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
              padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#856404' }}>
              ⚠️ <strong>Warning:</strong> Archiving is permanent and cannot be undone. 
              The resource will be hidden from public view.
            </div>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 12px' }}>
              Please provide a reason for archiving (required):
            </p>
            <textarea
              value={archiveReason}
              onChange={e => setArchiveReason(e.target.value)}
              placeholder="Reason for archiving..."
              rows={3}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            {archiveReason.trim() && (
              <p style={{ color: archiveReason.trim().split(/\s+/).length > 500 ? '#dc3545' : '#666', fontSize: 12, margin: '4px 0 0', textAlign: 'right' }}>
                {archiveReason.trim().split(/\s+/).length} / 500 words
              </p>
            )}
            {!archiveReason.trim() && (
              <p style={{ color: '#dc3545', fontSize: 12, margin: '4px 0 0' }}>
                Archive reason is required.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowArchiveModal(false); setArchiveReason(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #ccc',
                  background: 'white', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleArchive} disabled={!archiveReason.trim() || archiveReason.trim().split(/\s+/).length > 500}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: (!archiveReason.trim() || archiveReason.trim().split(/\s+/).length > 500) ? '#ccc' : '#6c757d',
                  color: 'white', fontWeight: 700, cursor: (!archiveReason.trim() || archiveReason.trim().split(/\s+/).length > 500) ? 'not-allowed' : 'pointer',
                  fontSize: 14 }}>
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Modal */}
      {showUnpublishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#0d6efd' }}>📥 Unpublish Resource</h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              Please provide a reason for unpublishing (required):
            </p>
            <textarea
              value={unpublishReason}
              onChange={e => setUnpublishReason(e.target.value)}
              placeholder="Reason for unpublishing..."
              rows={3}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            {unpublishReason.trim() && (
              <p style={{ color: unpublishReason.trim().split(/\s+/).length > 500 ? '#dc3545' : '#666', fontSize: 12, margin: '4px 0 0', textAlign: 'right' }}>
                {unpublishReason.trim().split(/\s+/).length} / 500 words
              </p>
            )}
            {!unpublishReason.trim() && (
              <p style={{ color: '#dc3545', fontSize: 12, margin: '4px 0 0' }}>
                Unpublish reason is required.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowUnpublishModal(false); setUnpublishReason(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #ccc',
                  background: 'white', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleUnpublish} disabled={!unpublishReason.trim() || unpublishReason.trim().split(/\s+/).length > 500}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: (!unpublishReason.trim() || unpublishReason.trim().split(/\s+/).length > 500) ? '#ccc' : '#0d6efd',
                  color: 'white', fontWeight: 700, cursor: (!unpublishReason.trim() || unpublishReason.trim().split(/\s+/).length > 500) ? 'not-allowed' : 'pointer',
                  fontSize: 14 }}>
                Confirm Unpublish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Republish Modal */}
      {showRepublishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#198754' }}>🔄 Republish Resource</h3>
            {history.filter(fb => fb.decision === 'UNPUBLISHED').length > 0 && (
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8,
                padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#856404' }}>
                <strong>Previous unpublish reason:</strong><br/>
                {history.find(fb => fb.decision === 'UNPUBLISHED')?.feedbackText || 'N/A'}
              </div>
            )}
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              I have reviewed the previous unpublish reason and confirm this resource can be republished:
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={republishConfirmed}
                onChange={e => setRepublishConfirmed(e.target.checked)}
                style={{ width: 18, height: 18 }} 
              />
              <span style={{ fontSize: 14, color: '#333' }}>I have reviewed and addressed the unpublish reason</span>
            </label>
            <textarea
              value={republishFeedback}
              onChange={e => setRepublishFeedback(e.target.value)}
              placeholder="Optional: Add feedback for republishing..."
              rows={3}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowRepublishModal(false); setRepublishFeedback(''); setRepublishConfirmed(false); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #ccc',
                  background: 'white', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleRepublish} disabled={!republishConfirmed}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: republishConfirmed ? '#198754' : '#ccc', color: 'white', fontWeight: 700,
                  cursor: republishConfirmed ? 'pointer' : 'not-allowed',
                  fontSize: 14 }}>
                Confirm Republish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, width: 440,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#198754' }}>✅ Approve Resource</h3>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 16px' }}>
              Adding feedback is <strong>optional</strong> but recommended.
            </p>
            <textarea
              value={approveFeedback}
              onChange={e => setApproveFeedback(e.target.value)}
              placeholder="Optional: Add approval comments…"
              rows={4}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ccc',
                fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            {approveFeedback.trim() && (
              <p style={{ color: approveFeedback.trim().split(/\s+/).length > 500 ? '#dc3545' : '#666', fontSize: 12, margin: '4px 0 0', textAlign: 'right' }}>
                {approveFeedback.trim().split(/\s+/).length} / 500 words
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowApproveModal(false); setApproveFeedback(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #ccc',
                  background: 'white', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleApprove} disabled={approveFeedback.trim() && approveFeedback.trim().split(/\s+/).length > 500}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: !approveFeedback.trim() || approveFeedback.trim().split(/\s+/).length <= 500 ? '#198754' : '#ccc',
                  color: 'white', cursor: !approveFeedback.trim() || approveFeedback.trim().split(/\s+/).length <= 500 ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: 14 }}>
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size media preview modal */}
      {previewMedia && (
        <div onClick={() => setPreviewMedia(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, cursor: 'zoom-out' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <button onClick={() => setPreviewMedia(null)}
              style={{ position: 'absolute', top: -14, right: -14, width: 30, height: 30,
                borderRadius: '50%', border: 'none', background: '#dc3545', color: 'white',
                cursor: 'pointer', fontSize: 16, fontWeight: 700, zIndex: 1 }}>
              ×
            </button>
            {previewMedia.mediaType === 'VIDEO' ? (
              <video controls src={previewMedia.fileUrl}
                style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 8 }} />
            ) : previewMedia.mediaType === 'AUDIO' ? (
              <div style={{ background: 'white', padding: 32, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
                <p style={{ margin: '0 0 16px', color: '#333' }}>{previewMedia.fileName}</p>
                <audio controls src={previewMedia.fileUrl} />
              </div>
            ) : (
              <img src={previewMedia.fileUrl} alt={previewMedia.fileName}
                style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: 8,
                  objectFit: 'contain', display: 'block' }} />
            )}
            <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center',
              marginTop: 8, fontSize: 12 }}>
              {previewMedia.fileName} · {previewMedia.mimeType} · Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceReviewPage;
