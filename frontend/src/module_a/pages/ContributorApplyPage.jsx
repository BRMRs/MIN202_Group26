import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { applyForContributor } from '../api/userApi';
import { APPLICATION_STATUS } from '../../common/utils/constants';

function ContributorApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // null | 'PENDING' | 'success' | 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setError('');
    setLoading(true);
    try {
      const res = await applyForContributor();
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
