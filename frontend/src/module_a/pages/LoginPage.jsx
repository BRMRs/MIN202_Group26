import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { sendResetCode, verifyResetCode, resetPassword } from '../api/authApi';
import { VALIDATION } from '../../common/utils/constants';
import Toast from '../../common/components/Toast';
import '../styles/auth.css';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const Logo = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="#1a1a1a" strokeWidth="2.5" fill="none"/>
    <ellipse cx="20" cy="20" rx="8" ry="18" stroke="#1a1a1a" strokeWidth="2" fill="none"/>
    <line x1="2" y1="20" x2="38" y2="20" stroke="#1a1a1a" strokeWidth="2"/>
    <line x1="5" y1="12" x2="35" y2="12" stroke="#1a1a1a" strokeWidth="1.5"/>
    <line x1="5" y1="28" x2="35" y2="28" stroke="#1a1a1a" strokeWidth="1.5"/>
  </svg>
);

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // view: 'login' | 'forgot' | 'verify-code' | 'new-password'
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // forgot step
  const [forgotEmail, setForgotEmail] = useState('');

  // verify-code step
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [verifiedCode, setVerifiedCode] = useState('');

  // new-password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (message, type = 'error') => setToast({ message, type });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goTo = (v) => { setView(v); setToast(null); };

  // --- Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    if (!form.username || !form.password) { showToast('Please fill in all fields.'); return; }
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

  // --- Forgot: send reset code ---
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { showToast('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await sendResetCode(forgotEmail);
      setCodeDigits(['', '', '', '', '', '']);
      setVerifiedCode('');
      goTo('verify-code');
    } catch (err) {
      showToast(err.response?.data?.message || 'No account found with that email.');
    } finally {
      setLoading(false);
    }
  };

  // --- Verify code: digit input helpers ---
  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);
    if (value && index < 5) digitRefs[index + 1].current?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCodeDigits(pasted.split(''));
      digitRefs[5].current?.focus();
    }
    e.preventDefault();
  };

  const handleResendReset = async () => {
    setLoading(true);
    try {
      await sendResetCode(forgotEmail);
      showToast('A new code has been sent to your email.', 'success');
      setCodeDigits(['', '', '', '', '', '']);
      digitRefs[0].current?.focus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // --- Verify code: submit (checks code without consuming it) ---
  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    const code = codeDigits.join('');
    if (code.length < 6) { showToast('Please enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await verifyResetCode({ email: forgotEmail, code });
      setVerifiedCode(code);
      setNewPassword('');
      setConfirmPassword('');
      goTo('new-password');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- New password: submit ---
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(newPassword)) {
      showToast(
        `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters and include an uppercase letter, a number, and a special character (!@#$%^&*).`
      );
      return;
    }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword({ email: forgotEmail, code: verifiedCode, newPassword });
      showToast('Password reset successful! Redirecting to login...', 'success');
      setTimeout(() => {
        setForgotEmail('');
        setVerifiedCode('');
        setNewPassword('');
        setConfirmPassword('');
        goTo('login');
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong. Please start over.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (view === 'forgot') {
    return (
      <div className="auth-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="auth-card">
          <div className="auth-logo"><Logo /> Heritage Platform</div>
          <div className="auth-tabs">
            <span className="auth-tab active">Forgot password</span>
          </div>
          <div className="auth-body">
            <h1 className="auth-title">Forgot password</h1>
            <p className="auth-subtitle">
              Enter the email address linked to your account and we'll send you a 6-digit reset code.
            </p>
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
                <button type="button" className="btn-secondary" onClick={() => goTo('login')}>
                  CANCEL
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'SENDING...' : 'SEND CODE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'verify-code') {
    return (
      <div className="auth-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="auth-card">
          <div className="auth-logo"><Logo /> Heritage Platform</div>
          <div className="auth-tabs">
            <span className="auth-tab active">Verify code</span>
          </div>
          <div className="auth-body">
            <h1 className="auth-title">Enter verification code</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{forgotEmail}</strong>. Enter it below to continue.
            </p>
            <form onSubmit={handleVerifyCodeSubmit}>
              <div className="auth-code-row">
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={digitRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className="auth-code-digit"
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    onPaste={i === 0 ? handleDigitPaste : undefined}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="auth-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => goTo('forgot')} disabled={loading}>
                  BACK
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'VERIFYING...' : 'VERIFY'}
                </button>
              </div>
              <p className="auth-resend">
                Didn't receive the code?{' '}
                <button type="button" className="auth-resend-btn" onClick={handleResendReset} disabled={loading}>
                  Resend
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'new-password') {
    return (
      <div className="auth-page">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="auth-card">
          <div className="auth-logo"><Logo /> Heritage Platform</div>
          <div className="auth-tabs">
            <span className="auth-tab active">Reset password</span>
          </div>
          <div className="auth-body">
            <h1 className="auth-title">Set new password</h1>
            <p className="auth-subtitle">
              Choose a new password for <strong>{forgotEmail}</strong>.
            </p>
            <form onSubmit={handleNewPasswordSubmit}>
              <div className="auth-field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <div className="field-hint">
                  Minimum {VALIDATION.MIN_PASSWORD_LENGTH} characters, must include uppercase, number and special character (!@#$%^&*)
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="auth-actions">
                <button type="button" className="btn-secondary" onClick={() => goTo('verify-code')} disabled={loading}>
                  BACK
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'SAVING...' : 'SAVE PASSWORD'}
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
        <div className="auth-logo"><Logo /> Heritage Platform</div>
        <div className="auth-tabs">
          <span className="auth-tab active">Log in &nbsp;登录</span>
          <Link to="/register" className="auth-tab">Join &nbsp;加入</Link>
        </div>
        <div className="auth-body">
          <h1 className="auth-title">Log in &nbsp;登录</h1>
          <form onSubmit={handleLoginSubmit}>
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
              <button type="button" className="btn-secondary" onClick={() => goTo('forgot')}>
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
