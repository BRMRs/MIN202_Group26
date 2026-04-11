import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import { resourceApi } from '../../module_b/api/resourceApi';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rejectedCount, setRejectedCount] = useState(0);

  const loadRejectedCount = useCallback(() => {
    resourceApi.getContributorRejectedCount()
      .then(res => setRejectedCount(Number(res.data?.rejectedCount) || 0))
      .catch(() => setRejectedCount(0));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CONTRIBUTOR') {
      loadRejectedCount();
    } else {
      setRejectedCount(0);
    }
  }, [isAuthenticated, user?.role, location.pathname, loadRejectedCount]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CONTRIBUTOR') return undefined;
    const onFocus = () => loadRejectedCount();
    window.addEventListener('focus', onFocus);
    const onDraftsChanged = () => loadRejectedCount();
    window.addEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('heritage-contributor-drafts-changed', onDraftsChanged);
    };
  }, [isAuthenticated, user?.role, loadRejectedCount]);

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
                    {rejectedCount > 0 && (
                      <span
                        title="有资源未通过审核，请查看管理员反馈"
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
                  {navLink('/admin/resources', 'Resources')}
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
                <span className="hn-avatar">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
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
