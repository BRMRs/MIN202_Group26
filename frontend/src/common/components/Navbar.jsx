import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { resourceApi } from '../../module_b/api/resourceApi';
import {
  buildStatusNotifications,
  fetchResourceReviewHistories,
  statusUpdateReadStoreKey,
} from '../utils/statusNotifications';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [draftAttentionCount, setDraftAttentionCount] = useState(0);
  const [unseenStatusNoticeCount, setUnseenStatusNoticeCount] = useState(0);
  const [hasRejectedApplication, setHasRejectedApplication] = useState(false);

  const rejectionReadStoreKey = useCallback(
    (u) => `heritage-rejection-read:${u?.id ?? u?.username ?? 'anonymous'}`,
    []
  );

  const applicationStatus = user?.applicationStatus ?? user?.contributorApplicationStatus ?? null;
  const applicationReviewedAt =
    user?.applicationReviewedAt ?? user?.contributorApplicationReviewedAt ?? null;

  const loadContributorNotices = useCallback(async () => {
    try {
      const [countRes, mineRes] = await Promise.all([
        resourceApi.getContributorRejectedCount(),
        resourceApi.getMine(),
      ]);

      const draftCount = countRes.data?.draftAttentionCount ?? countRes.data?.rejectedCount;
      const rawMine = mineRes.data?.data ?? mineRes.data;
      const mine = Array.isArray(rawMine) ? rawMine : [];

      let readMap = {};
      try {
        const raw = localStorage.getItem(statusUpdateReadStoreKey(user));
        const parsed = raw ? JSON.parse(raw) : {};
        readMap = parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        readMap = {};
      }

      const historyByResourceId = await fetchResourceReviewHistories(mine);
      const notifications = buildStatusNotifications(mine, historyByResourceId);
      const unread = notifications.filter((item) => !readMap[item.readKey]).length;

      setDraftAttentionCount(Number(draftCount) || 0);
      setUnseenStatusNoticeCount(unread);
    } catch {
      setDraftAttentionCount(0);
      setUnseenStatusNoticeCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CONTRIBUTOR') {
      loadContributorNotices();
    } else {
      setDraftAttentionCount(0);
      setUnseenStatusNoticeCount(0);
    }

    if (isAuthenticated && user?.role === 'VIEWER') {
      const isRejected = applicationStatus === 'REJECTED';
      const reviewedMarker = applicationReviewedAt || 'reviewed';
      const readToken = localStorage.getItem(rejectionReadStoreKey(user));
      const hasUnreadRejection = isRejected && reviewedMarker && readToken !== String(reviewedMarker);
      setHasRejectedApplication(Boolean(hasUnreadRejection));
    } else {
      setHasRejectedApplication(false);
    }
  }, [
    isAuthenticated,
    user,
    user?.role,
    location.pathname,
    loadContributorNotices,
    applicationStatus,
    applicationReviewedAt,
    rejectionReadStoreKey,
  ]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CONTRIBUTOR') return undefined;
    const onFocus = () => loadContributorNotices();
    window.addEventListener('focus', onFocus);
    const onDraftsChanged = () => loadContributorNotices();
    window.addEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
    const onStatusUpdateRead = () => loadContributorNotices();
    window.addEventListener('heritage-status-update-read', onStatusUpdateRead);
    const onStorage = (e) => {
      if (e.key === statusUpdateReadStoreKey(user)) {
        loadContributorNotices();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
      window.removeEventListener('heritage-status-update-read', onStatusUpdateRead);
      window.removeEventListener('storage', onStorage);
    };
  }, [isAuthenticated, user, user?.role, loadContributorNotices]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'VIEWER') return undefined;

    const onRejectionRead = () => {
      setHasRejectedApplication(false);
    };

    window.addEventListener('heritage-rejection-read', onRejectionRead);
    return () => {
      window.removeEventListener('heritage-rejection-read', onRejectionRead);
    };
  }, [isAuthenticated, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { pathname } = location;

  const navLink = (to, label) => (
    <Link to={to} className={`hn-link${pathname === to ? ' hn-link-active' : ''}`}>
      {label}
    </Link>
  );

  return (
    <nav className="hn-nav">
      <div className="hn-inner">
        {/* Logo */}
        <Link to="/" className="hn-logo">
          <span className="hn-logo-icon">🏛</span>
          Heritage Platform
        </Link>

        {/* Centre nav links */}
        <div className="hn-links">
          {navLink('/', 'Browse')}

          {isAuthenticated && (
            <>
              {user?.role === 'VIEWER' && navLink('/apply-contributor', 'Become Contributor')}

              {user?.role === 'CONTRIBUTOR' && (
                <>
                  {navLink('/module-b/submit', 'Create Resource')}
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <Link
                      to="/module-b/drafts"
                      className={`hn-link${pathname === '/module-b/drafts' ? ' hn-link-active' : ''}`}
                    >
                      Drafts
                    </Link>
                    {draftAttentionCount > 0 && (
                      <span
                        title="Resources have status notifications. Please check the latest feedback."
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -10,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#e53935',
                          boxShadow: '0 0 0 2px #fff',
                        }}
                        aria-hidden
                      />
                    )}
                  </span>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  {navLink('/admin/users', 'Users')}
                  {navLink('/reviews', 'Review Queue')}
                  {navLink('/admin/categories', 'Categories')}
                  {navLink('/admin/tags', 'Tags')}
                  {navLink('/admin/dashboard', 'Reports')}
                </>
              )}
            </>
          )}
        </div>

        {/* Right: auth controls */}
        <div className="hn-right">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hn-profile-link" title="View profile">
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <span className="hn-avatar">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                  {((user?.role === 'CONTRIBUTOR' && unseenStatusNoticeCount > 0)
                    || (user?.role === 'VIEWER' && hasRejectedApplication)) && (
                    <span
                      title={
                        user?.role === 'VIEWER'
                          ? 'Your contributor application has been reviewed.'
                          : 'You have Resource Status Notifications in Profile.'
                      }
                      style={{
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#e53935',
                        boxShadow: '0 0 0 2px #fff',
                      }}
                      aria-hidden
                    />
                  )}
                </span>
                <span className="hn-username">{user?.username}</span>
              </Link>
              <button className="hn-logout-btn" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hn-login-link">Login</Link>
              <Link to="/register" className="hn-register-btn">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
