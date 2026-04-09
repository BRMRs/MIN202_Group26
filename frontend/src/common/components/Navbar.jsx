import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                  {navLink('/module-b/submit', 'Submit Resource')}
                  {navLink('/module-b/drafts', 'My Drafts')}
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
