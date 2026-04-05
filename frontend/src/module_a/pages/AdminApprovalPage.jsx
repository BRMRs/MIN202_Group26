import { useState, useEffect } from 'react';
import { getApplications, approveApplication, rejectApplication } from '../api/userApi';

function AdminApprovalPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores the id being processed

  const fetchApplications = () => {
    setLoading(true);
    getApplications()
      .then((res) => setApplications(res.data.data))
      .catch(() => setError('Failed to load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this application? The user will become a Contributor.')) return;
    setActionLoading(id);
    try {
      await approveApplication(id);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    setActionLoading(id);
    try {
      await rejectApplication(id);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div style={{ margin: '2rem' }}>Loading applications...</div>;
  if (error) return <div style={{ margin: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
      <h2>Contributor Applications</h2>
      {applications.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>ID</th>
              <th style={{ padding: '0.5rem' }}>User ID</th>
              <th style={{ padding: '0.5rem' }}>Applied At</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{app.id}</td>
                <td style={{ padding: '0.5rem' }}>{app.userId}</td>
                <td style={{ padding: '0.5rem' }}>
                  {app.appliedAt ? new Date(app.appliedAt).toLocaleString() : '-'}
                </td>
                <td style={{ padding: '0.5rem' }}>{app.status}</td>
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {app.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={actionLoading === app.id}
                        style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4 }}
                      >
                        {actionLoading === app.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={actionLoading === app.id}
                        style={{ padding: '0.3rem 0.75rem', cursor: 'pointer', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4 }}
                      >
                        {actionLoading === app.id ? '...' : 'Reject'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminApprovalPage;
