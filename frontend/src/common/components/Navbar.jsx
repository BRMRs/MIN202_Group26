import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

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
              <Link to="/module-b/submit">Submit Resource</Link>
              <Link to="/module-b/drafts">Drafts</Link>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <Link to="/admin/users">Users</Link>
              <Link to="/module-b/review">Review Resources</Link>
              <Link to="/reviews">Review Dashboard</Link>
              <Link to="/admin/categories">Categories</Link>
              <Link to="/admin/tags">Tags</Link>
              <Link to="/admin/resources">Resources</Link>
            </>
          )}
          <button onClick={handleLogout}>Logout</button>
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
