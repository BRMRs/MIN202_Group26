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

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', borderBottom: '1px solid #ddd' }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none' }}>
        Heritage Platform
      </Link>

      <span style={{ flex: 1 }} />

      {isAuthenticated ? (
        <>
          <span>Hi, {user?.username}</span>
          <Link to="/profile">Profile</Link>
          {user?.role === 'VIEWER' && <Link to="/apply-contributor">Become Contributor</Link>}
          {user?.role === 'CONTRIBUTOR' && (
            <>
              <Link to="/module-b/submit">Create Resource</Link>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <Link to="/module-b/drafts">Drafts</Link>
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
              <Link to="/admin/users">Users</Link>
              <Link to="/reviews">资源审核</Link>
              <Link to="/admin/categories">Categories</Link>
              <Link to="/admin/tags">Tags</Link>
              <Link to="/admin/resources">Resources</Link>
            </>
          )}
          <button type="button" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default Navbar;
