import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import Toast from '../../common/components/Toast';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [toast, setToast] = useState(null); // { message, type }
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!form.username || !form.password) {
      showToast('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(form);
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        if (userData.role === 'ADMIN') {
          navigate('/admin/users');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.6rem', cursor: 'pointer' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default LoginPage;
