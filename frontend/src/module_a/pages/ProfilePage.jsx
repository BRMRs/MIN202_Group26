import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { updateProfile } from '../api/userApi';
import { resourceApi } from '../../module_b/api/resourceApi';
import { getReviewHistory } from '../../module_c/api/reviewApi';
import { pickLatestDecisionTextByAny } from '../../module_b/utils/reviewFeedback';
import { VALIDATION, USER_ROLES } from '../../common/utils/constants';
import styles from './ProfilePage.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',      label: 'My Resources' },
  { id: 'draft',    label: 'Drafts' },
  { id: 'pending',  label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'statusUpdates', label: 'Status Updates' },
];

const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',          cls: 'statusDraft' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'statusPending' },
  APPROVED:       { label: 'Approved',       cls: 'statusApproved' },
  REJECTED:       { label: 'Rejected',       cls: 'statusRejected' },
  UNPUBLISHED:    { label: 'Unpublished',    cls: 'statusUnpublished' },
  ARCHIVED:       { label: 'Archived',       cls: 'statusArchived' },
};

const REASON_FALLBACK = 'Not available';
const STATUS_UPDATE_STATUSES = ['APPROVED', 'REJECTED', 'UNPUBLISHED', 'ARCHIVED'];

const statusUpdateReadStoreKey = (user) =>
  `heritage-status-update-read-map:${user?.id ?? user?.username ?? 'anonymous'}`;

const statusNoticeSeenCountKey = (user) =>
  `heritage-status-notice-seen-count:${user?.id ?? user?.username ?? 'anonymous'}`;

function decisionForStatus(status) {
  if (status === 'APPROVED') return ['REPUBLISHED', 'APPROVED'];
  if (status === 'REJECTED') return ['REJECTED'];
  if (status === 'UNPUBLISHED') return ['UNPUBLISHED'];
  if (status === 'ARCHIVED') return ['ARCHIVED'];
  return [];
}

function reasonLabelForStatus(status) {
  if (status === 'APPROVED') return 'Approval note';
  if (status === 'REJECTED') return 'Reviewer note';
  if (status === 'UNPUBLISHED') return 'Unpublish reason';
  if (status === 'ARCHIVED') return 'Archive reason';
  return 'Review note';
}

function isStatusUpdateResource(resource) {
  return STATUS_UPDATE_STATUSES.includes(resource?.status);
}

function statusUpdateItemKey(resource) {
  return `${resource?.id}:${resource?.status}:${resource?.updatedAt || resource?.createdAt || ''}`;
}

function noteClassForStatus(status) {
  if (status === 'APPROVED') return 'reviewNoteApproved';
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

function ResourceCard({ resource, reviewNote, stylesMod, isStatusUpdateTab = false, onMarkAsRead }) {
  const navigate = useNavigate();
  const status = resource.status;
  const cover  = resource.mediaFiles?.[0]?.url ?? null;
  const showReviewNote = decisionForStatus(status).length > 0;
  const noteClass = noteClassForStatus(status);

  return (
    <div className={stylesMod.resourceCard}>
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
            Updated {fmtDate(resource.updatedAt || resource.createdAt)}
          </span>

          <div className={stylesMod.cardActions}>
            {isStatusUpdateTab ? (
              <button
                className={stylesMod.actionBtnSecondary}
                onClick={() => onMarkAsRead?.(resource)}
                type="button"
              >
                Mark as Read
              </button>
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
    title: 'No status updates yet',
    sub: 'Approval and admin status-change notes will appear here.',
    action: { label: 'View All Resources', to: '/profile' },
  },
};

function EmptyState({ tabId, isContributor, stylesMod }) {
  if (!isContributor) {
    return (
      <div className={stylesMod.emptyPanel}>
        <span className={stylesMod.emptyIcon}>🌿</span>
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
            <label className={stylesMod.label} htmlFor="ep-avatar">Avatar URL</label>
            <input
              id="ep-avatar"
              className={stylesMod.input}
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className={stylesMod.modalActions}>
            <button type="button" className={stylesMod.btnSecondary} onClick={onCancel}>Cancel</button>
            <button type="submit" className={stylesMod.btnPrimary} disabled={loading}>
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
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');

  // Content state (contributor only)
  const [allResources, setAllResources]   = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError]   = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [readStatusUpdateMap, setReadStatusUpdateMap] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  const isContributor = user?.role === USER_ROLES.CONTRIBUTOR;
  const isAdmin       = user?.role === USER_ROLES.ADMIN;

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

  // Fetch review notes for rejected/unpublished/archived resources
  useEffect(() => {
    const targets = allResources.filter((r) => decisionForStatus(r.status).length > 0);
    if (!targets.length) return;
    Promise.all(
      targets.map((r) =>
        getReviewHistory(r.id)
          .then((res) => {
            const list = res.data?.data;
            const decisions = decisionForStatus(r.status);
            const fromHistory = pickLatestDecisionTextByAny(Array.isArray(list) ? list : [], decisions);
            const fromArchiveField = r.archiveReason && String(r.archiveReason).trim()
              ? String(r.archiveReason).trim()
              : null;
            const fromResource = r.reviewFeedback && String(r.reviewFeedback).trim()
              ? String(r.reviewFeedback).trim()
              : null;
            return { id: r.id, text: fromHistory || fromArchiveField || fromResource || REASON_FALLBACK };
          })
          .catch(() => {
            const fromArchiveField = r.archiveReason && String(r.archiveReason).trim()
              ? String(r.archiveReason).trim()
              : null;
            const fromResource = r.reviewFeedback && String(r.reviewFeedback).trim()
              ? String(r.reviewFeedback).trim()
              : null;
            return { id: r.id, text: fromArchiveField || fromResource || REASON_FALLBACK };
          })
      )
    ).then((rows) => {
      const map = {};
      rows.forEach(({ id, text }) => { map[id] = text; });
      setReviewNotes(map);
    });
  }, [allResources]);

  const statusUpdateResources = allResources.filter(isStatusUpdateResource);
  const unreadStatusUpdates = statusUpdateResources.filter(
    (r) => !readStatusUpdateMap[statusUpdateItemKey(r)]
  );

  const markStatusUpdateAsRead = (resource) => {
    if (!resource) return;
    const key = statusUpdateItemKey(resource);
    if (readStatusUpdateMap[key]) return;

    setReadStatusUpdateMap((prev) => {
      const next = { ...prev, [key]: true };
      localStorage.setItem(statusUpdateReadStoreKey(user), JSON.stringify(next));
      return next;
    });

    const seenCount = Number(localStorage.getItem(statusNoticeSeenCountKey(user))) || 0;
    localStorage.setItem(statusNoticeSeenCountKey(user), String(seenCount + 1));
    window.dispatchEvent(new CustomEvent('heritage-status-update-read'));
  };

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

  const handleSave = (updatedForm) => {
    setEditing(false);
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(''), 4000);
    // Note: full user re-fetch would need AuthContext refresh;
    // for now we rely on next page load to reflect changes.
  };

  if (!user) return <div style={{ padding: '2rem' }}>Loading…</div>;

  const initials = user.username?.[0]?.toUpperCase() || 'U';

  // Derive contributor application status from user object
  // Backend may surface this as user.contributorApplicationStatus or user.applicationStatus
  const appStatus = user.contributorApplicationStatus ?? user.applicationStatus ?? null;

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
            <div className={styles.viewerPanelIcon}>🌿</div>
            <div className={styles.viewerPanelBody}>
              <strong>Want to share heritage resources?</strong>
              <p>
                {appStatus === 'PENDING'
                  ? 'Your contributor application is under review. You will gain access once an administrator approves it.'
                  : appStatus === 'REJECTED'
                  ? 'Your previous application was not approved. You may reapply with more details.'
                  : 'Apply to become a contributor and start sharing cultural and community heritage resources with the world.'}
              </p>
            </div>
            {appStatus !== 'PENDING' && (
              <Link to="/apply-contributor" className={styles.viewerPanelCta}>
                {appStatus === 'REJECTED' ? 'Reapply' : 'Apply Now'}
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
            <StatCard label="Status Updates" value={stats.statusUpdates} accent="statusUpdates" stylesMod={styles} onClick={() => setActiveTab('statusUpdates')} />
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
                  className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
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
                      ? <span className={styles.tabCount}>{n}</span>
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
                  {tabResources.map((r) => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      reviewNote={reviewNotes[r.id]}
                      stylesMod={styles}
                      isStatusUpdateTab={activeTab === 'statusUpdates'}
                      onMarkAsRead={markStatusUpdateAsRead}
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
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;
