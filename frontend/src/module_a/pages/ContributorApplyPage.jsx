import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { applyForContributor } from '../api/userApi';
import { APPLICATION_STATUS } from '../../common/utils/constants';

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
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Contributor Application</h2>
        <p>You are already a <strong>{user.role}</strong>. No application needed.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Go Home
        </button>
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

  if (status === APPLICATION_STATUS.PENDING) {
    return (
      <div style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
        <h2>Application Submitted</h2>
        <p>Your application is <strong>pending review</strong> by an administrator.</p>
        <p>You will be notified once a decision has been made.</p>
        <button onClick={() => navigate('/profile')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Apply to Become a Contributor</h2>
      <p>As a contributor you can submit cultural heritage resources for review and publication.</p>
      <p>Your application will be reviewed by an administrator.</p>

      <div style={{ marginTop: '1.5rem' }}>
        <label htmlFor="reason" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>
          Reason for Application <span style={{ color: 'red' }}>*</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={MAX_REASON_LENGTH}
          rows={4}
          placeholder="Please explain why you want to become a contributor..."
          style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box', resize: 'vertical', fontSize: '0.95rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.2rem' }}>
          {reasonError ? (
            <span style={{ color: 'red' }}>{reasonError}</span>
          ) : (
            <span />
          )}
          <span style={{ color: reason.length >= MAX_REASON_LENGTH ? 'red' : '#888' }}>
            {reason.length}/{MAX_REASON_LENGTH}
          </span>
        </div>
      </div>

      {error && <p style={{ color: 'red', marginTop: '0.75rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button onClick={handleApply} disabled={loading} style={{ padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button onClick={() => navigate('/profile')} style={{ padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ContributorApplyPage;
