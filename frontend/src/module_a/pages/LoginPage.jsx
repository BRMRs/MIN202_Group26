import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { sendResetCode, verifyResetCode, resetPassword } from '../api/authApi';
import PasswordRequirements, { isPasswordValid } from '../components/PasswordRequirements';
import Toast from '../../common/components/Toast';
import '../styles/auth.css';

const CODE_TTL_SECONDS = 5 * 60;
const RESEND_WAIT_SECONDS = 60;

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
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  // new-password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (message, type = 'error') => setToast({ message, type });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const goTo = (v) => { setView(v); setToast(null); };
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const rest = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${rest}`;
  };
  const startCodeTimers = () => {
    setCodeExpiresIn(CODE_TTL_SECONDS);
    setResendIn(RESEND_WAIT_SECONDS);
  };

  useEffect(() => {
    if (view !== 'verify-code') return undefined;
    const timer = setInterval(() => {
      setCodeExpiresIn((seconds) => Math.max(seconds - 1, 0));
      setResendIn((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

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
      startCodeTimers();
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
      startCodeTimers();
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
    if (codeExpiresIn <= 0) { showToast('This code has expired. Please request a new one.'); return; }
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
    if (!isPasswordValid(newPassword)) {
      showToast('Please complete all password requirements.');
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
          <div className="auth-logo">Heritage Platform</div>
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
          <div className="auth-logo">Heritage Platform</div>
          <div className="auth-tabs">
            <span className="auth-tab active">Verify code</span>
          </div>
          <div className="auth-body">
            <h1 className="auth-title">Enter verification code</h1>
            <p className="auth-subtitle">
              We sent a 6-digit code to <strong>{forgotEmail}</strong>. It is valid for 5 minutes.
            </p>
            <p className={`auth-code-timer ${codeExpiresIn === 0 ? 'expired' : ''}`}>
              {codeExpiresIn > 0
                ? `Code expires in ${formatTime(codeExpiresIn)}`
                : 'Code expired. Please request a new one.'}
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
                <button type="submit" className="btn-primary" disabled={loading || codeExpiresIn === 0}>
                  {loading ? 'VERIFYING...' : 'VERIFY'}
                </button>
              </div>
              <p className="auth-resend">
                Didn't receive the code?{' '}
                <button type="button" className="auth-resend-btn" onClick={handleResendReset} disabled={loading || resendIn > 0}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend'}
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
          <div className="auth-logo">Heritage Platform</div>
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
                <PasswordRequirements password={newPassword} />
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
        <div className="auth-logo">Heritage Platform</div>
        <div className="auth-tabs">
          <span className="auth-tab active">Log in</span>
          <Link to="/register" className="auth-tab">Join</Link>
        </div>
        <div className="auth-body">
          <h1 className="auth-title">Log in</h1>
          <form onSubmit={handleLoginSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Email or username</label>
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
              <label htmlFor="password">Password</label>
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
                FORGOT PASSWORD
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
