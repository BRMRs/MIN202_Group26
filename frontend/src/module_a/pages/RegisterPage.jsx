import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendVerificationCode, verifyCodeAndRegister } from '../api/authApi';
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

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [agreed13, setAgreed13] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const showToast = (message, type = 'error') => setToast({ message, type });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      showToast('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showToast('Please enter a valid email address.');
      return;
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      showToast(
        `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters and include an uppercase letter, a number, and a special character (!@#$%^&*).`
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }
    if (!agreed13 || !agreedTerms) {
      showToast('Please confirm the required agreements below.');
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode(form.email);
      setStep('verify');
      setCodeDigits(['', '', '', '', '', '']);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...codeDigits];
    next[index] = value;
    setCodeDigits(next);
    if (value && index < 5) {
      digitRefs[index + 1].current?.focus();
    }
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = codeDigits.join('');
    if (code.length < 6) {
      showToast('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyCodeAndRegister({
        username: form.username,
        email: form.email,
        password: form.password,
        code,
      });
      showToast('Registration successful! Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendVerificationCode(form.email);
      showToast('A new code has been sent to your email.', 'success');
      setCodeDigits(['', '', '', '', '', '']);
      digitRefs[0].current?.focus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend code.');
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
          <Link to="/login" className="auth-tab">Log in</Link>
          <span className="auth-tab active">Join</span>
        </div>

        <div className="auth-body">
          {step === 'form' ? (
            <>
              <h1 className="auth-title">Join</h1>
              <p className="auth-subtitle">
                Join us today to save your favourite items, create galleries, access multilingual search and translation and request and manage your API keys.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoFocus
                  />
                  <div className="field-hint required">Required</div>
                </div>

                <div className="auth-field">
                  <label htmlFor="username">Choose a username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={form.username}
                    onChange={handleChange}
                  />
                  <div className="field-hint">Required — Your username might be publicly displayed</div>
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Create password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <div className="field-hint">
                    Minimum {VALIDATION.MIN_PASSWORD_LENGTH} characters, must include uppercase, number and special character (!@#$%^&*)
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Confirm new Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-checkbox">
                  <input
                    id="agreed13"
                    type="checkbox"
                    checked={agreed13}
                    onChange={(e) => setAgreed13(e.target.checked)}
                  />
                  <label htmlFor="agreed13">I confirm that I am at least 13 years old</label>
                </div>

                <div className="auth-checkbox">
                  <input
                    id="agreedTerms"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <label htmlFor="agreedTerms">
                    I confirm that I have read and accept the{' '}
                    <a href="#terms">Terms of use</a> and <a href="#privacy">Privacy statement</a>
                  </label>
                </div>

                <div className="auth-actions-right">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'SENDING...' : 'JOIN'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">Verify your email</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong>{form.email}</strong>. Enter it below to complete your registration.
              </p>
              <form onSubmit={handleVerify}>
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

                <div className="auth-actions-right" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginRight: '0.75rem' }}
                    onClick={() => { setStep('form'); setToast(null); }}
                    disabled={loading}
                  >
                    BACK
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'VERIFYING...' : 'VERIFY'}
                  </button>
                </div>

                <p className="auth-resend">
                  Didn't receive the code?{' '}
                  <button type="button" className="auth-resend-btn" onClick={handleResend} disabled={loading}>
                    Resend
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
