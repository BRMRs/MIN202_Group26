import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { resourceApi } from '../../module_b/api/resourceApi';

const statusNoticeSeenKey = (user) =>
  `heritage-status-notice-seen:${user?.id ?? user?.username ?? 'anonymous'}`;

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [draftAttentionCount, setDraftAttentionCount] = useState(0);
  const [statusNoticeTotal, setStatusNoticeTotal] = useState(0);
  const [unseenStatusNoticeCount, setUnseenStatusNoticeCount] = useState(0);

  const loadRejectedCount = useCallback(() => {
    resourceApi.getContributorRejectedCount()
      .then(res => {
        const draftCount = res.data?.draftAttentionCount ?? res.data?.rejectedCount;
        const noticeCount = res.data?.statusNoticeCount ?? draftCount;
        const total = Number(noticeCount) || 0;
        const seenRaw = localStorage.getItem(statusNoticeSeenKey(user));
        const seen = Number(seenRaw) || 0;
        setDraftAttentionCount(Number(draftCount) || 0);
        setStatusNoticeTotal(total);
        setUnseenStatusNoticeCount(Math.max(total - seen, 0));
      })
      .catch(() => {
        setDraftAttentionCount(0);
        setStatusNoticeTotal(0);
        setUnseenStatusNoticeCount(0);
      });
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CONTRIBUTOR') {
      loadRejectedCount();
    } else {
      setDraftAttentionCount(0);
      setStatusNoticeTotal(0);
      setUnseenStatusNoticeCount(0);
    }
  }, [isAuthenticated, user?.role, location.pathname, loadRejectedCount]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CONTRIBUTOR') return undefined;
    const onFocus = () => loadRejectedCount();
    window.addEventListener('focus', onFocus);
    const onDraftsChanged = () => loadRejectedCount();
    window.addEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
    const onStatusUpdatesViewed = () => {
      localStorage.setItem(statusNoticeSeenKey(user), String(statusNoticeTotal));
      setUnseenStatusNoticeCount(0);
    };
    window.addEventListener('heritage-status-updates-viewed', onStatusUpdatesViewed);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
      window.removeEventListener('heritage-status-updates-viewed', onStatusUpdatesViewed);
    };
  }, [isAuthenticated, user, user?.role, loadRejectedCount, statusNoticeTotal]);

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
                        title="Resources have status updates. Please check the latest feedback."
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
                  {user?.role === 'CONTRIBUTOR' && unseenStatusNoticeCount > 0 && (
                    <span
                      title="You have status updates in Profile."
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
