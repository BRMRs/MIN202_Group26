import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import styles from './AdminReviewPage.module.css'

export default function AdminReviewPage() {
  const [pending, setPending] = useState([])
  const [feedback, setFeedback] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resourceApi.getPending()
      .then(r => setPending(r.data))
      .catch(() => setMsg('Failed to load. Please confirm you are logged in as ADMIN.'))
      .finally(() => setLoading(false))
  }, [])

  const handleReview = async (id, approved) => {
    if (!feedback[id]?.trim()) {
      setMsg('Please enter review feedback first')
      return
    }
    try {
      await resourceApi.review(id, approved, feedback[id])
      setMsg(approved ? `#${id} approved` : `#${id} rejected`)
      resourceApi.getPending().then(r => setPending(r.data))
    } catch (e) {
      setMsg(e.response?.data?.error || 'Operation failed')
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>Review Desk <span className={styles.badge}>{pending.length}</span></h2>
        {msg && <div className={styles.msg}>{msg}</div>}
        {loading && <p className={styles.muted}>Loading...</p>}
        {!loading && pending.length === 0 && <p className={styles.muted}>No pending resources</p>}
        {pending.map(r => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.id}>#{r.id}</span>
              <h3>{r.title || '(Untitled)'}</h3>
              <span className={styles.contributor}>Contributor ID: {r.contributorId}</span>
            </div>
            <div className={styles.meta}>
              <span>Category: {r.category || '-'}</span>
              <span>Location: {r.place || '-'}</span>
              <span>Tags: {r.tags || '-'}</span>
            </div>
            <p className={styles.desc}>{r.description}</p>
            {r.externalLink && <a href={r.externalLink} target="_blank" rel="noreferrer" className={styles.link}>External link</a>}
            <textarea
              className={styles.textarea}
              placeholder="Review feedback (required for approve/reject)"
              value={feedback[r.id] || ''}
              onChange={e => setFeedback(prev => ({ ...prev, [r.id]: e.target.value }))}
            />
            <div className={styles.actions}>
              <button className={styles.btnApprove} onClick={() => handleReview(r.id, true)}>Approve</button>
              <button className={styles.btnReject} onClick={() => handleReview(r.id, false)}>Reject</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}