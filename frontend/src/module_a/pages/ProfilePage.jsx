import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { updateProfile, uploadAvatar } from '../api/userApi';
import { resourceApi } from '../../module_b/api/resourceApi';
import { pickLatestDecisionTextByAny } from '../../module_b/utils/reviewFeedback';
import { VALIDATION, USER_ROLES } from '../../common/utils/constants';
import {
  buildStatusNotifications,
  fetchResourceReviewHistories,
  statusUpdateReadStoreKey,
} from '../../common/utils/statusNotifications';
import styles from './ProfilePage.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',      label: 'All My Resources' },
  { id: 'draft',    label: 'Drafts' },
  { id: 'pending',  label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'statusUpdates', label: 'Resource Status Notifications' },
];

const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',          cls: 'statusDraft' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'statusPending' },
  APPROVED:       { label: 'Approved',       cls: 'statusApproved' },
  REPUBLISHED:    { label: 'Republished',    cls: 'statusRepublished' },
  REJECTED:       { label: 'Rejected',       cls: 'statusRejected' },
  UNPUBLISHED:    { label: 'Unpublished',    cls: 'statusUnpublished' },
  ARCHIVED:       { label: 'Archived',       cls: 'statusArchived' },
};

const REASON_FALLBACK = 'Not available';

function decisionForStatus(status) {
  if (status === 'APPROVED') return ['REPUBLISHED', 'APPROVED'];
  if (status === 'REPUBLISHED') return ['REPUBLISHED'];
  if (status === 'REJECTED') return ['REJECTED'];
  if (status === 'UNPUBLISHED') return ['UNPUBLISHED'];
  if (status === 'ARCHIVED') return ['ARCHIVED'];
  return [];
}

function reasonLabelForStatus(status) {
  if (status === 'APPROVED') return 'Approval note';
  if (status === 'REPUBLISHED') return 'Republish note';
  if (status === 'REJECTED') return 'Reviewer note';
  if (status === 'UNPUBLISHED') return 'Unpublish reason';
  if (status === 'ARCHIVED') return 'Archive reason';
  return 'Review note';
}

function noteClassForStatus(status) {
  if (status === 'APPROVED') return 'reviewNoteApproved';
  if (status === 'REPUBLISHED') return 'reviewNoteApproved';
  if (status === 'REJECTED') return 'reviewNoteRejected';
  if (status === 'UNPUBLISHED') return 'reviewNoteUnpublished';
  if (status === 'ARCHIVED') return 'reviewNoteArchived';
  return 'reviewNoteDefault';
}

function statusBadge(status, stylesMod) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'statusDraft' };
  return (
    <span className={`${stylesMod.statusBadge} ${stylesMod[cfg.cls]}`}>
      {cfg.label}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDateTimeMinute(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function CoverOrPlaceholder({ url, title, stylesMod }) {
  if (url) {
    return <img src={url} alt={title} className={stylesMod.cardCover} />;
  }
  return (
    <div className={stylesMod.cardNoImage}>
      <span className={stylesMod.cardNoImageIcon}>🏛</span>
      <span className={stylesMod.cardNoImageLabel}>No image</span>
    </div>
  );
}

// ── Resource card shared by all tabs ─────────────────────────────────────────

function ResourceCard({
  resource,
  reviewNote,
  stylesMod,
  isStatusUpdateTab = false,
  onMarkAsRead,
  onOpenInMyResources,
}) {
  const navigate = useNavigate();
  const status = resource.status;
  const eventTime = resource.statusChangedAt || resource.updatedAt || resource.createdAt;
  const mediaFiles = Array.isArray(resource.mediaFiles) ? resource.mediaFiles : [];
  const explicitCover = mediaFiles.find((m) => m?.mediaType === 'COVER');
  const firstMedia = mediaFiles[0];
  const cover = explicitCover?.fileUrl
    || explicitCover?.url
    || firstMedia?.fileUrl
    || firstMedia?.url
    || resource.fileUrl
    || resource.filePath
    || null;
  const showReviewNote = decisionForStatus(status).length > 0;
  const noteClass = noteClassForStatus(status);

  return (
    <div className={stylesMod.resourceCard} data-resource-id={resource.id}>
      <div className={stylesMod.cardImageCol}>
        <CoverOrPlaceholder url={cover} title={resource.title} stylesMod={stylesMod} />
      </div>

      <div className={stylesMod.cardBodyCol}>
        {/* Badges row */}
        <div className={stylesMod.cardBadges}>
          {statusBadge(status, stylesMod)}
          {resource.category?.name && (
            <span className={stylesMod.metaBadge}>{resource.category.name}</span>
          )}
          {resource.place && (
            <span className={`${stylesMod.metaBadge} ${stylesMod.metaBadgePlace}`}>
              {resource.place}
            </span>
          )}
        </div>

        {/* Title */}
        <div className={stylesMod.cardTitle}>{resource.title || '(Untitled)'}</div>

        {/* Description */}
        {resource.description && (
          <p className={stylesMod.cardDesc}>{resource.description}</p>
        )}

        {/* Review note */}
        {showReviewNote && (
          <div className={`${stylesMod.reviewNote} ${stylesMod[noteClass]}`}>
            <strong>{reasonLabelForStatus(status)}:</strong> {reviewNote || REASON_FALLBACK}
          </div>
        )}

        {/* Footer */}
        <div className={stylesMod.cardFooter}>
          <span className={stylesMod.cardDate}>
            {isStatusUpdateTab ? `Status changed ${fmtDateTimeMinute(eventTime)}` : `Updated ${fmtDate(eventTime)}`}
          </span>

          <div className={stylesMod.cardActions}>
            {isStatusUpdateTab ? (
              <>
                <button
                  className={stylesMod.actionBtn}
                  onClick={() => onOpenInMyResources?.(resource.id)}
                  type="button"
                >
                  Open in All My Resources
                </button>
                <button
                  className={stylesMod.actionBtnSecondary}
                  onClick={() => onMarkAsRead?.(resource)}
                  type="button"
                >
                  Mark as Read
                </button>
              </>
            ) : (
              <>
            {/* DRAFT actions */}
            {status === 'DRAFT' && (
              <>
                <button
                  className={stylesMod.actionBtn}
                  onClick={() => navigate('/module-b/drafts')}
                >
                  Continue Editing
                </button>
                <Link to="/module-b/drafts" className={stylesMod.actionBtnSecondary}>
                  Manage Drafts
                </Link>
              </>
            )}

            {/* PENDING_REVIEW actions */}
            {status === 'PENDING_REVIEW' && (
              <button
                className={stylesMod.actionBtnSecondary}
                onClick={() => navigate('/module-b/drafts')}
              >
                View Submission
              </button>
            )}

            {/* APPROVED actions */}
            {status === 'APPROVED' && (
              <Link to={`/resources/${resource.id}`} className={stylesMod.actionBtn}>
                View Public Page
              </Link>
            )}

            {/* REJECTED actions */}
            {status === 'REJECTED' && (
              <>
                <button
                  className={stylesMod.actionBtn}
                  onClick={() => navigate('/module-b/drafts')}
                >
                  Revise & Resubmit
                </button>
                <Link to={`/resources/${resource.id}`} className={stylesMod.actionBtnSecondary}>
                  View Feedback
                </Link>
              </>
            )}

            {/* UNPUBLISHED */}
            {status === 'UNPUBLISHED' && (
              <span className={stylesMod.actionHint}>
                Awaiting admin republish
              </span>
            )}

            {/* ARCHIVED */}
            {status === 'ARCHIVED' && (
              <span className={stylesMod.actionHint}>
                No further action available
              </span>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty states per tab ──────────────────────────────────────────────────────

const EMPTY_CONFIG = {
  all: {
    icon: '📂',
    title: "You haven't created any resources yet",
    sub: "Start contributing by creating your first heritage resource.",
    action: { label: 'Create Resource', to: '/module-b/submit' },
  },
  draft: {
    icon: '✏️',
    title: "You don't have any drafts yet",
    sub: "Create a new resource and save it as a draft to continue later.",
    action: { label: 'Create Resource', to: '/module-b/submit' },
  },
  pending: {
    icon: '⏳',
    title: 'No resources are waiting for review',
    sub: "Resources you submit for review will appear here while awaiting approval.",
    action: { label: 'Go to Drafts', to: '/module-b/drafts' },
  },
  approved: {
    icon: '✅',
    title: "You haven't published any resources yet",
    sub: "Once an administrator approves your submission it will appear here.",
    action: { label: 'Browse Resources', to: '/' },
  },
  rejected: {
    icon: '🔄',
    title: 'No rejected resources',
    sub: "Rejected resources that need revision will appear here.",
    action: { label: 'View All Resources', to: '/profile' },
  },
  statusUpdates: {
    icon: '🔔',
    title: 'No resource status notifications yet',
    sub: 'Approval and admin status-change notifications will appear here.',
    action: { label: 'View All Resources', to: '/profile' },
  },
};

function EmptyState({ tabId, isContributor, stylesMod }) {
  if (!isContributor) {
    return (
      <div className={stylesMod.emptyPanel}>

        <h3 className={stylesMod.emptyTitle}>Become a Contributor</h3>
        <p className={stylesMod.emptySubtitle}>
          Apply for contributor access to start sharing heritage resources with the community.
        </p>
        <div className={stylesMod.emptyActions}>
          <Link to="/apply-contributor" className={stylesMod.emptyActionBtn}>
            Apply Now
          </Link>
          <Link to="/" className={`${stylesMod.emptyActionBtn} ${stylesMod.emptyActionBtnSecondary}`}>
            Browse Resources
          </Link>
        </div>
      </div>
    );
  }

  const cfg = EMPTY_CONFIG[tabId] || EMPTY_CONFIG.all;
  return (
    <div className={stylesMod.emptyPanel}>
      <span className={stylesMod.emptyIcon}>{cfg.icon}</span>
      <h3 className={stylesMod.emptyTitle}>{cfg.title}</h3>
      <p className={stylesMod.emptySubtitle}>{cfg.sub}</p>
      <div className={stylesMod.emptyActions}>
        {cfg.action && (
          <Link to={cfg.action.to} className={stylesMod.emptyActionBtn}>
            {cfg.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, stylesMod, onClick }) {
  return (
    <button
      type="button"
      className={`${stylesMod.statCard} ${accent ? stylesMod[`statAccent_${accent}`] : ''}`}
      onClick={onClick}
    >
      <span className={stylesMod.statValue}>{value}</span>
      <span className={stylesMod.statLabel}>{label}</span>
    </button>
  );
}

// ── Contributor status badge ──────────────────────────────────────────────────

function ContributorStatusBadge({ applicationStatus, role, stylesMod }) {
  if (role === USER_ROLES.CONTRIBUTOR) {
    return (
      <span className={`${stylesMod.csBadge} ${stylesMod.csBadgeApproved}`}>
        Contributor Approved
      </span>
    );
  }
  if (role === USER_ROLES.ADMIN) return null;

  // VIEWER
  if (!applicationStatus || applicationStatus === 'NOT_APPLIED') {
    return (
      <Link to="/apply-contributor" className={`${stylesMod.csBadge} ${stylesMod.csBadgeApply}`}>
        Apply to Contribute
      </Link>
    );
  }
  if (applicationStatus === 'PENDING') {
    return (
      <span className={`${stylesMod.csBadge} ${stylesMod.csBadgePending}`}>
        Application Pending
      </span>
    );
  }
  if (applicationStatus === 'REJECTED') {
    return (
      <span className={`${stylesMod.csBadge} ${stylesMod.csBadgeRejected}`}>
        Application Rejected
      </span>
    );
  }
  return null;
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role, stylesMod }) {
  const cls =
    role === 'CONTRIBUTOR' ? stylesMod.roleBadgeContributor
    : role === 'ADMIN'     ? stylesMod.roleBadgeAdmin
    :                        stylesMod.roleBadgeViewer;
  const label = role ? (role.charAt(0) + role.slice(1).toLowerCase()) : 'Viewer';
  return <span className={`${stylesMod.roleBadge} ${cls}`}>{label}</span>;
}

// ── Edit Profile Modal (inline) ───────────────────────────────────────────────

function EditProfileModal({ user, onSave, onCancel, stylesMod }) {
  const [form, setForm] = useState({
    username: user.username || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setAvatarUploading(true);
    try {
      const res = await uploadAvatar(file);
      setForm((current) => ({ ...current, avatarUrl: res.data?.data || '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Avatar upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.bio.length > VALIDATION.MAX_BIO_LENGTH) {
      setError(`Bio must not exceed ${VALIDATION.MAX_BIO_LENGTH} characters.`);
      return;
    }
    setLoading(true);
    try {
      await updateProfile(form);
      onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={stylesMod.modalOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={stylesMod.modal}>
        <div className={stylesMod.modalHeader}>
          <h2 className={stylesMod.modalTitle}>Edit Profile</h2>
          <button type="button" className={stylesMod.modalClose} onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className={stylesMod.errorAlert}>{error}</div>}
          <div className={stylesMod.fieldGroup}>
            <label className={stylesMod.label} htmlFor="ep-username">Username</label>
            <input
              id="ep-username"
              className={stylesMod.input}
              name="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className={stylesMod.fieldGroup}>
            <div className={stylesMod.labelRow}>
              <label className={stylesMod.label} htmlFor="ep-bio">Bio</label>
              <span className={stylesMod.counter}>{form.bio.length}/{VALIDATION.MAX_BIO_LENGTH}</span>
            </div>
            <textarea
              id="ep-bio"
              className={stylesMod.textarea}
              name="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className={stylesMod.fieldGroup}>
            <label className={stylesMod.label} htmlFor="ep-avatar">Profile picture</label>
            <div className={stylesMod.avatarUploadRow}>
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Profile preview" className={stylesMod.avatarPreview} />
              ) : (
                <div className={stylesMod.avatarPreviewFallback}>
                  {(form.username || user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className={stylesMod.avatarUploadControls}>
                <input
                  id="ep-avatar"
                  className={stylesMod.fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading || loading}
                />
                <div className={stylesMod.fileHint}>PNG, JPG, WEBP, or GIF. Max 5MB.</div>
              </div>
            </div>
          </div>
          <div className={stylesMod.modalActions}>
            <button type="button" className={stylesMod.btnSecondary} onClick={onCancel}>Cancel</button>
            <button type="submit" className={stylesMod.btnPrimary} disabled={loading || avatarUploading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────

function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');

  // Content state (contributor only)
  const [allResources, setAllResources]   = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError]   = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [statusNotifications, setStatusNotifications] = useState([]);
  const [readStatusUpdateMap, setReadStatusUpdateMap] = useState({});
  const [focusResourceId, setFocusResourceId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const isContributor = user?.role === USER_ROLES.CONTRIBUTOR;
  const isAdmin       = user?.role === USER_ROLES.ADMIN;

  const appStatus = user?.contributorApplicationStatus ?? user?.applicationStatus ?? null;
  const appReviewedAt = user?.applicationReviewedAt ?? user?.contributorApplicationReviewedAt ?? null;
  const appRejectReason = user?.applicationRejectReason ?? user?.contributorApplicationRejectReason ?? '';
  const rejectionReadStoreKey = `heritage-rejection-read:${user?.id ?? user?.username ?? 'anonymous'}`;

  useEffect(() => {
    refreshProfile?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || user.role !== USER_ROLES.VIEWER || appStatus !== 'REJECTED') return;

    const reviewedMarker = appReviewedAt || 'reviewed';
    localStorage.setItem(rejectionReadStoreKey, String(reviewedMarker));
    window.dispatchEvent(new CustomEvent('heritage-rejection-read'));
  }, [user, appStatus, appReviewedAt, rejectionReadStoreKey]);

  // Load contributor resources
  useEffect(() => {
    if (!isContributor) return;
    setContentLoading(true);
    resourceApi.getMine()
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data
                   : Array.isArray(res.data)       ? res.data
                   : [];
        setAllResources(list);
        return list;
      })
      .catch(() => setContentError('Failed to load your resources.'))
      .finally(() => setContentLoading(false));
  }, [isContributor]);

  useEffect(() => {
    if (!isContributor) {
      setReviewNotes({});
      setStatusNotifications([]);
      setReadStatusUpdateMap({});
      return;
    }
    try {
      const raw = localStorage.getItem(statusUpdateReadStoreKey(user));
      const parsed = raw ? JSON.parse(raw) : {};
      setReadStatusUpdateMap(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setReadStatusUpdateMap({});
    }
  }, [isContributor, user]);

  // Fetch review notes and build per-status-change notifications
  useEffect(() => {
    if (!isContributor || allResources.length === 0) {
      setReviewNotes({});
      setStatusNotifications([]);
      return;
    }

    let isCancelled = false;

    fetchResourceReviewHistories(allResources)
      .then((historyByResourceId) => {
        if (isCancelled) return;

        const nextNotes = {};

        allResources.forEach((resource) => {
          const decisions = decisionForStatus(resource.status);
          if (decisions.length === 0) return;

          const history = Array.isArray(historyByResourceId[resource.id]) ? historyByResourceId[resource.id] : [];
          const fromHistory = pickLatestDecisionTextByAny(history, decisions);
          const fromArchiveField = resource.archiveReason && String(resource.archiveReason).trim()
            ? String(resource.archiveReason).trim()
            : null;
          const fromResource = resource.reviewFeedback && String(resource.reviewFeedback).trim()
            ? String(resource.reviewFeedback).trim()
            : null;

          nextNotes[resource.id] = fromHistory || fromArchiveField || fromResource || REASON_FALLBACK;
        });

        setReviewNotes(nextNotes);
        setStatusNotifications(buildStatusNotifications(allResources, historyByResourceId));
      })
      .catch(() => {
        if (isCancelled) return;

        const nextNotes = {};
        allResources.forEach((resource) => {
          const decisions = decisionForStatus(resource.status);
          if (decisions.length === 0) return;
          const fromArchiveField = resource.archiveReason && String(resource.archiveReason).trim()
            ? String(resource.archiveReason).trim()
            : null;
          const fromResource = resource.reviewFeedback && String(resource.reviewFeedback).trim()
            ? String(resource.reviewFeedback).trim()
            : null;
          nextNotes[resource.id] = fromArchiveField || fromResource || REASON_FALLBACK;
        });

        setReviewNotes(nextNotes);
        setStatusNotifications([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [isContributor, allResources]);

  const unreadStatusUpdates = statusNotifications.filter(
    (item) => !readStatusUpdateMap[item.readKey]
  );

  const markStatusUpdateAsRead = (item) => {
    const key = item?.statusUpdateKey ?? item?.readKey;
    if (!key) return;
    if (readStatusUpdateMap[key]) return;

    setReadStatusUpdateMap((prev) => {
      const next = { ...prev, [key]: true };
      localStorage.setItem(statusUpdateReadStoreKey(user), JSON.stringify(next));
      return next;
    });
    window.dispatchEvent(new CustomEvent('heritage-status-update-read'));
  };

  const openStatusUpdateInMyResources = (resourceId) => {
    setFocusResourceId(resourceId);
    setActiveTab('all');
  };

  useEffect(() => {
    if (activeTab !== 'all' || !focusResourceId) return;
    const target = document.querySelector(`[data-resource-id="${focusResourceId}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add(styles.resourceCardFocus);
    const timer = setTimeout(() => {
      target.classList.remove(styles.resourceCardFocus);
      setFocusResourceId(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeTab, focusResourceId]);

  // Filter resources per tab
  const tabResources = (() => {
    if (activeTab === 'all')      return allResources;
    if (activeTab === 'draft')    return allResources.filter((r) => r.status === 'DRAFT');
    if (activeTab === 'pending')  return allResources.filter((r) => r.status === 'PENDING_REVIEW');
    if (activeTab === 'approved') return allResources.filter((r) => r.status === 'APPROVED');
    if (activeTab === 'rejected') return allResources.filter((r) => r.status === 'REJECTED');
    if (activeTab === 'statusUpdates') return unreadStatusUpdates;
    return [];
  })();

  // Quick stats counts
  const stats = {
    drafts:   allResources.filter((r) => r.status === 'DRAFT').length,
    pending:  allResources.filter((r) => r.status === 'PENDING_REVIEW').length,
    approved: allResources.filter((r) => r.status === 'APPROVED').length,
    rejected: allResources.filter((r) => r.status === 'REJECTED').length,
    statusUpdates: unreadStatusUpdates.length,
    total:    allResources.length,
  };

  const handleSave = () => {
    setEditing(false);
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(''), 4000);
    refreshProfile?.();
  };

  if (!user) return <div style={{ padding: '2rem' }}>Loading…</div>;

  const initials = user.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className={styles.page}>
      {editing && (
        <EditProfileModal
          user={user}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          stylesMod={styles}
        />
      )}

      <div className={styles.container}>

        {/* ── Profile Header ─────────────────────────────────────── */}
        <div className={styles.profileHeader}>
          {/* Avatar */}
          <div className={styles.avatarWrap}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
          </div>

          {/* Identity */}
          <div className={styles.identityBlock}>
            <h1 className={styles.userName}>{user.username}</h1>
            <p className={styles.userEmail}>{user.email}</p>

            {/* Badges row */}
            <div className={styles.badgesRow}>
              <RoleBadge role={user.role} stylesMod={styles} />
              <ContributorStatusBadge
                role={user.role}
                applicationStatus={appStatus}
                stylesMod={styles}
              />
            </div>

            {/* Bio */}
            {user.bio ? (
              <p className={styles.userBio}>{user.bio}</p>
            ) : (
              <p className={styles.userBioEmpty}>No bio yet — add one to tell the community about yourself.</p>
            )}
          </div>

          {/* Edit button */}
          <div className={styles.headerActions}>
            <button className={styles.btnEditProfile} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
            {isContributor && (
              <Link to="/module-b/submit" className={styles.btnCreateResource}>
                + Create Resource
              </Link>
            )}
          </div>
        </div>

        {/* Success alert */}
        {success && <div className={styles.successAlert}>{success}</div>}

        {/* ── Viewer guidance (not yet contributor) ──────────────── */}
        {!isContributor && !isAdmin && (
          <div className={styles.viewerPanel}>

            <div className={styles.viewerPanelBody}>
              <strong>Want to share heritage resources?</strong>
              <p>
                {appStatus === 'PENDING'
                  ? 'Your contributor application is under review. You will gain access once an administrator approves it.'
                  : appStatus === 'REJECTED'
                  ? 'Your previous application was not approved. You may reapply with more details.'
                  : 'Apply to become a contributor and start sharing cultural and community heritage resources with the world.'}
              </p>
              {appStatus === 'REJECTED' && appRejectReason && (
                <div className={styles.viewerRejectReason}>
                  <strong>Admin feedback:</strong>
                  <span>{appRejectReason}</span>
                </div>
              )}
            </div>
            {appStatus !== 'PENDING' && (
              <Link to="/apply-contributor" className={styles.viewerPanelCta}>
                {appStatus === 'REJECTED' ? 'Reapply' : 'Apply Now'}
              </Link>
            )}
            {appStatus === 'PENDING' && (
              <Link to="/apply-contributor" className={styles.viewerPanelCtaMuted}>
                View Pending Status
              </Link>
            )}
          </div>
        )}

        {/* ── Quick Stats (contributor only) ────────────────────── */}
        {isContributor && (
          <div className={styles.statsRow}>
            <StatCard label="Total"          value={stats.total}    stylesMod={styles} onClick={() => setActiveTab('all')} />
            <StatCard label="Drafts"         value={stats.drafts}   stylesMod={styles} onClick={() => setActiveTab('draft')} />
            <StatCard label="Pending Review" value={stats.pending}  stylesMod={styles} onClick={() => setActiveTab('pending')} />
            <StatCard label="Approved"       value={stats.approved} accent="approved"  stylesMod={styles} onClick={() => setActiveTab('approved')} />
            <StatCard label="Rejected"       value={stats.rejected} accent="rejected"  stylesMod={styles} onClick={() => setActiveTab('rejected')} />
            <StatCard
              label="Status Updates"
              value={stats.statusUpdates}
              accent="statusUpdates"
              stylesMod={styles}
              onClick={() => setActiveTab('statusUpdates')}
            />
          </div>
        )}

        {/* ── Content Tabs (contributor only) ───────────────────── */}
        {isContributor && (
          <div className={styles.tabsSection}>
            {/* Tab bar */}
            <div className={styles.tabBar} role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`${styles.tabBtn} ${t.id === 'statusUpdates' ? styles.tabBtnNotice : ''} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  {t.id === 'statusUpdates' && stats.statusUpdates > 0 && (
                    <span
                      className={`${styles.tabAlertDot} ${styles.tabAlertDotTop}`}
                      title="You have new resource status notifications."
                      aria-hidden
                    />
                  )}
                  {/* Count pip */}
                  {t.id !== 'all' && (() => {
                    const map = {
                      draft: stats.drafts,
                      pending: stats.pending,
                      approved: stats.approved,
                      rejected: stats.rejected,
                      statusUpdates: stats.statusUpdates,
                    };
                    const n = map[t.id] ?? 0;
                    return n > 0
                      ? <span className={`${styles.tabCount} ${t.id === 'statusUpdates' ? styles.tabCountAlert : ''}`}>{n}</span>
                      : null;
                  })()}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className={styles.tabContent} role="tabpanel">
              {contentError && (
                <div className={styles.errorAlert}>{contentError}</div>
              )}

              {contentLoading ? (
                <div className={styles.loadingMsg}>Loading your resources…</div>
              ) : tabResources.length === 0 ? (
                <EmptyState tabId={activeTab} isContributor={isContributor} stylesMod={styles} />
              ) : (
                <div className={styles.resourceList}>
                  {activeTab === 'statusUpdates'
                    ? tabResources.map((item) => (
                      <ResourceCard
                        key={item.readKey}
                        resource={{
                          ...item.resource,
                          status: item.decision,
                          statusChangedAt: item.reviewedAt,
                          statusUpdateKey: item.readKey,
                        }}
                        reviewNote={item.feedbackText || REASON_FALLBACK}
                        stylesMod={styles}
                        isStatusUpdateTab
                        onMarkAsRead={markStatusUpdateAsRead}
                        onOpenInMyResources={openStatusUpdateInMyResources}
                      />
                    ))
                    : tabResources.map((r) => (
                      <ResourceCard
                        key={r.id}
                        resource={r}
                        reviewNote={reviewNotes[r.id]}
                        stylesMod={styles}
                        isStatusUpdateTab={false}
                        onMarkAsRead={markStatusUpdateAsRead}
                        onOpenInMyResources={openStatusUpdateInMyResources}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Account info (always visible at bottom) ───────────── */}
        <div className={styles.accountCard}>
          <p className={styles.sectionLabel}>Account Information</p>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Username</span>
              <span className={styles.infoValue}>{user.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Role</span>
              <span className={styles.infoValue}>{user.role}</span>
            </div>
            {appStatus && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Application</span>
                <span className={styles.infoValue}>{appStatus}</span>
              </div>
            )}
            {appStatus === 'REJECTED' && appRejectReason && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Reject Reason</span>
                <span className={styles.infoValue}>{appRejectReason}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;
