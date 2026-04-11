import { useState, useEffect } from 'react';
import useAuth from '../../common/hooks/useAuth';
import { updateProfile } from '../api/userApi';
import { VALIDATION } from '../../common/utils/constants';
import styles from './ProfilePage.module.css';

function roleBadgeClass(role) {
  if (role === 'CONTRIBUTOR') return `${styles.roleBadge} ${styles.roleBadgeContributor}`;
  if (role === 'ADMIN') return `${styles.roleBadge} ${styles.roleBadgeAdmin}`;
  return `${styles.roleBadge} ${styles.roleBadgeViewer}`;
}

function ProfilePage() {
  const { user } = useAuth();
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

  if (!user) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const initials = user.username?.[0]?.toUpperCase() || 'U';
  const roleLabel = user.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : 'Viewer';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <p className={styles.pageEyebrow}>Community Heritage Platform</p>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <p className={styles.pageSubtitle}>
            Manage your account information and contributor status.
          </p>
        </div>

        {/* Main card */}
        <div className={styles.card}>
          {/* Avatar + identity row */}
          <div className={styles.avatarRow}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar}>{initials}</div>
            )}
            <div className={styles.avatarInfo}>
              <div className={styles.usernameDisplay}>{user.username}</div>
              <span className={roleBadgeClass(user.role)}>{roleLabel}</span>
            </div>
          </div>

          {!editing ? (
            <>
              {success && <div className={styles.successAlert}>{success}</div>}

              {/* Account Information */}
              <p className={styles.sectionLabel}>Account Information</p>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Username</span>
                  <span className={styles.infoValue}>{user.username}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{user.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Role</span>
                  <span className={styles.infoValue}>{user.role}</span>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* About / Bio */}
              <p className={styles.sectionLabel}>About</p>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Bio</span>
                  {user.bio ? (
                    <span className={styles.infoValue}>{user.bio}</span>
                  ) : (
                    <span className={styles.infoEmpty}>No bio yet</span>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.btnPrimary} onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className={styles.errorAlert}>{error}</div>}

              <p className={styles.sectionLabel}>Edit Profile</p>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="username">Username</label>
                <input
                  id="username"
                  className={styles.input}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="bio">Bio</label>
                  <span className={styles.counter}>
                    {form.bio.length}/{VALIDATION.MAX_BIO_LENGTH}
                  </span>
                </div>
                <textarea
                  id="bio"
                  className={styles.textarea}
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="avatarUrl">Avatar URL</label>
                <input
                  id="avatarUrl"
                  className={styles.input}
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
