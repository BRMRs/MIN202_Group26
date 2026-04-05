import { useState, useEffect } from 'react';
import useAuth from '../../common/hooks/useAuth';
import { updateProfile } from '../api/userApi';
import { VALIDATION } from '../../common/utils/constants';

function ProfilePage() {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', avatarUrl: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setForm({
      username: user.username || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
    });
    setEditing(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.bio.length > VALIDATION.MAX_BIO_LENGTH) {
      setError(`Bio must not exceed ${VALIDATION.MAX_BIO_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>My Profile</h2>

      {!editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {user.avatarUrl && (
            <img src={user.avatarUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          )}
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Bio:</strong> {user.bio || <em>No bio yet</em>}</p>
          {success && <p style={{ color: 'green' }}>{success}</p>}
          <button onClick={() => setEditing(true)} style={{ width: 120, padding: '0.5rem', cursor: 'pointer' }}>
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <label>Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </div>
          <div>
            <label>Bio <span style={{ color: '#888', fontSize: '0.85rem' }}>({form.bio.length}/{VALIDATION.MAX_BIO_LENGTH})</span></label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </div>
          <div>
            <label>Avatar URL</label>
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={handleCancel} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
