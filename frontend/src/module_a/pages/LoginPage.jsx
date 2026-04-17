import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import Toast from '../../common/components/Toast';
import '../styles/auth.css';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [form, setForm] = useState({ username: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        if (userData.role === 'ADMIN') navigate('/admin/users');
        else navigate('/');
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) { showToast('Please enter your email address.'); return; }
    showToast('If this email is registered, a reset link has been sent.', 'success');
  };

  // Logo SVG (heritage/globe style, matching the page theme)
  const Logo = () => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#1a1a1a" strokeWidth="2.5" fill="none"/>
      <ellipse cx="20" cy="20" rx="8" ry="18" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
      <line x1="2" y1="20" x2="38" y2="20" stroke="#1a1a1a" strokeWidth="2"/>
      <line x1="5" y1="12" x2="35" y2="12" stroke="#1a1a1a" strokeWidth="1.5"/>
      <line x1="5" y1="28" x2="35" y2="28" stroke="#1a1a1a" strokeWidth="1.5"/>
    </svg>
  );

  if (view === 'forgot') {
    return (
      <div className="auth-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="auth-card">
          <div className="auth-logo">
            <Logo />
            Heritage Platform
          </div>

          <div className="auth-tabs">
            <span className="auth-tab active">Forgot password</span>
          </div>

          <div className="auth-body">
            <h1 className="auth-title">Forgot password</h1>
            <form onSubmit={handleForgotSubmit}>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="auth-actions">
                <button type="button" className="btn-secondary" onClick={() => { setView('login'); setToast(null); }}>
                  CANCEL
                </button>
                <button type="submit" className="btn-primary">
                  RESET PASSWORD
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
          Heritage Platform
        </div>

        <div className="auth-tabs">
          <span className="auth-tab active">Log in &nbsp;登录</span>
          <Link to="/register" className="auth-tab">Join &nbsp;加入</Link>
        </div>

        <div className="auth-body">
          <h1 className="auth-title">Log in &nbsp;登录</h1>
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Email or username &nbsp;邮箱或用户名</label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password &nbsp;密码</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="auth-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setView('forgot'); setToast(null); }}
              >
                FORGOT PASSWORD &nbsp;忘记密码
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'LOGGING IN...' : 'LOG IN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
