import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../common/hooks/useAuth';
import { applyForContributor } from '../api/userApi';
import { APPLICATION_STATUS } from '../../common/utils/constants';
import styles from './ContributorApplyPage.module.css';

const MAX_REASON_LENGTH = 2000;
const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EVIDENCE_EXTENSIONS = ['.docx', '.pdf', '.txt', '.png', '.jpg', '.jpeg', '.mov', '.mp4', '.mp3'];

function ContributorApplyPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null); // null | 'PENDING' | 'success' | 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');

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

  const existingApplicationStatus = user?.contributorApplicationStatus ?? user?.applicationStatus ?? null;
  const applicationRejectReason = user?.applicationRejectReason ?? user?.contributorApplicationRejectReason ?? '';
  const isApplicationPending = status === APPLICATION_STATUS.PENDING || existingApplicationStatus === APPLICATION_STATUS.PENDING;

  if (isApplicationPending) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.stateCard}>
            <span className={styles.stateIcon}>🕐</span>
            <h2 className={styles.stateTitle}>Application Pending</h2>
            <p className={styles.stateText}>
              You have already applied to become a contributor, and your application is <strong>pending review</strong> by an administrator.
            </p>
            <p className={styles.stateText}>You cannot submit another application until an administrator approves or rejects this one.</p>
            <button className={styles.btnAction} onClick={() => navigate('/profile')}>
              View My Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFilesChange = (event) => {
    setFileError('');
    const selected = Array.from(event.target.files || []);
    const next = [...files];
    for (const file of selected) {
      if (next.length >= MAX_EVIDENCE_FILES) break;
      const lowerName = file.name.toLowerCase();
      const allowed = ALLOWED_EVIDENCE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!allowed) {
        setFileError('Evidence files support docx, pdf, txt, png, jpg, jpeg, mov, mp4, and mp3 only.');
        continue;
      }
      if (file.size > MAX_EVIDENCE_FILE_SIZE) {
        setFileError('Each evidence file must not exceed 50MB.');
        continue;
      }
      const alreadySelected = next.some((item) => (
        item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
      ));
      if (alreadySelected) continue;
      next.push(file);
    }
    if (files.length + selected.length > MAX_EVIDENCE_FILES) {
      setFileError(`You can upload up to ${MAX_EVIDENCE_FILES} evidence files.`);
    }
    setFiles(next);
    event.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setFileError('');
  };

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
      const res = await applyForContributor(reason.trim(), files);
      setStatus(res.data.data.status);
      await refreshProfile?.();
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
          {existingApplicationStatus === APPLICATION_STATUS.REJECTED && applicationRejectReason && (
            <div className={styles.rejectFeedback}>
              <strong>Your previous application was rejected for this reason:</strong>
              <p>{applicationRejectReason}</p>
              <span>Please revise your new application to address this feedback directly.</span>
            </div>
          )}

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

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="evidence">
              Supporting Materials <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="evidence"
              className={styles.fileInput}
              type="file"
              multiple
              accept={ALLOWED_EVIDENCE_EXTENSIONS.join(',')}
              onChange={handleFilesChange}
            />
            <p className={styles.fileHint}>
              Upload up to {MAX_EVIDENCE_FILES} files. Supported: {ALLOWED_EVIDENCE_EXTENSIONS.join(' / ')}. Max 50MB each.
            </p>
            {fileError && <span className={styles.fieldError}>{fileError}</span>}
            {files.length > 0 && (
              <ul className={styles.fileList}>
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                    <span>{file.name}</span>
                    <button type="button" className={styles.fileRemoveBtn} onClick={() => removeFile(index)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
