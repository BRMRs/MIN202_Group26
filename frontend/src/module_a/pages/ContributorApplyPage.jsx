import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { applyForContributor } from '../api/userApi';
import { APPLICATION_STATUS } from '../../common/utils/constants';
import styles from './ContributorApplyPage.module.css';

const MAX_REASON_LENGTH = 100;

function ContributorApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // null | 'PENDING' | 'success' | 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  // Already a contributor or admin — nothing to do here
  if (user && user.role !== 'VIEWER') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateCard}>
            <span className={styles.stateIcon}>✓</span>
            <h2 className={styles.stateTitle}>
              You're already a {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </h2>
            <p className={styles.stateText}>No application needed — you already have contributor access.</p>
            <button className={styles.btnAction} onClick={() => navigate('/')}>
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === APPLICATION_STATUS.PENDING) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateCard}>
            <span className={styles.stateIcon}>🕐</span>
            <h2 className={styles.stateTitle}>Application submitted</h2>
            <p className={styles.stateText}>
              Your application is <strong>pending review</strong> by an administrator.
            </p>
            <p className={styles.stateText}>You will be notified once a decision has been made.</p>
            <button className={styles.btnAction} onClick={() => navigate('/profile')}>
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    setReasonError('');
    if (!reason.trim()) {
      setReasonError('Please provide a reason for your application.');
      return;
    }
    if (reason.trim().length > MAX_REASON_LENGTH) {
      setReasonError(`Reason must not exceed ${MAX_REASON_LENGTH} characters.`);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await applyForContributor(reason.trim());
      setStatus(res.data.data.status);
    } catch (err) {
      const msg = err.response?.data?.message || 'Application failed. Please try again.';
      if (msg.includes('already pending')) {
        setStatus(APPLICATION_STATUS.PENDING);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <p className={styles.pageEyebrow}>Community Heritage Platform</p>
          <h1 className={styles.pageTitle}>Become a Contributor</h1>
          <p className={styles.pageSubtitle}>
            Share cultural and community heritage resources with the world.
          </p>
        </div>

        {/* Contributor benefits info panel */}
        <div className={styles.infoPanel}>
          <span className={styles.infoIcon}>🏛️</span>
          <div className={styles.infoText}>
            <strong>Contributor access</strong> lets you submit heritage resources, save drafts,
            and track your submissions through the review process.
            Your application will be reviewed by an administrator.
          </div>
        </div>

        {/* Application card */}
        <div className={styles.card}>
          <p className={styles.sectionLabel}>Application Details</p>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="reason">
              Reason for Application <span className={styles.req}>*</span>
            </label>
            <textarea
              id="reason"
              className={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_REASON_LENGTH}
              rows={5}
              placeholder="Please explain why you want to become a contributor and what kind of heritage resources you plan to share…"
            />
            <div className={styles.counterRow}>
              {reasonError ? (
                <span className={styles.fieldError}>{reasonError}</span>
              ) : (
                <span />
              )}
              <span className={reason.length >= MAX_REASON_LENGTH ? styles.counterWarn : styles.counter}>
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnSecondary} type="button" onClick={() => navigate('/profile')}>
              Cancel
            </button>
            <button className={styles.btnPrimary} type="button" onClick={handleApply} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContributorApplyPage;
