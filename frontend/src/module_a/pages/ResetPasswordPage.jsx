import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Toast from '../../common/components/Toast';
import { resetPassword } from '../api/authApi';
import '../styles/auth.css';

const Logo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="#1a1a1a" strokeWidth="2.5" fill="none"/>
    <ellipse cx="20" cy="20" rx="8" ry="18" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
    <line x1="2" y1="20" x2="38" y2="20" stroke="#1a1a1a" strokeWidth="2"/>
    <line x1="5" y1="12" x2="35" y2="12" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="5" y1="28" x2="35" y2="28" stroke="#1a1a1a" strokeWidth="1.5"/>
  </svg>
);

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirm) { showToast('Please fill in all fields.'); return; }
    if (form.newPassword.length < 8) { showToast('Password must be at least 8 characters.'); return; }
    if (form.newPassword !== form.confirm) { showToast('Passwords do not match.'); return; }
    if (!token) { showToast('Invalid reset link.'); return; }

    setLoading(true);
    try {
      await resetPassword(token, form.newPassword);
      setDone(true);
      showToast('Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="auth-card">
        <div className="auth-logo">
          <Logo />
          Heritage Platform
        </div>
        <div className="auth-tabs">
          <span className="auth-tab active">Reset Password</span>
        </div>
        <div className="auth-body">
          <h1 className="auth-title">Set a new password</h1>
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                autoFocus
                disabled={done}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                disabled={done}
              />
            </div>
            <div className="auth-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/login')}>
                CANCEL
              </button>
              <button type="submit" className="btn-primary" disabled={loading || done}>
                {loading ? 'SAVING...' : 'SAVE PASSWORD'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
