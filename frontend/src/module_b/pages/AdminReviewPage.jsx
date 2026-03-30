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
      .catch(() => setMsg('加载失败，请确认已登录（ADMIN角色）'))
      .finally(() => setLoading(false))
  }, [])

  const handleReview = async (id, approved) => {
    if (!feedback[id]?.trim()) {
      setMsg('请填写审核反馈后再操作')
      return
    }
    try {
      await resourceApi.review(id, approved, feedback[id])
      setMsg(approved ? `#${id} 审核通过` : `#${id} 已拒绝`)
      resourceApi.getPending().then(r => setPending(r.data))
    } catch (e) {
      setMsg(e.response?.data?.error || '操作失败')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Community Heritage</h1>
        <nav>
          <a href="/module-b/submit">提交资源</a>
          <a href="/module-b/drafts">草稿箱</a>
          <a href="/module-b/review">审核台</a>
        </nav>
      </header>

      <main className={styles.main}>
        <h2>审核台 <span className={styles.badge}>{pending.length}</span></h2>
        {msg && <div className={styles.msg}>{msg}</div>}
        {loading && <p className={styles.muted}>加载中...</p>}
        {!loading && pending.length === 0 && <p className={styles.muted}>暂无待审核资源</p>}
        {pending.map(r => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.id}>#{r.id}</span>
              <h3>{r.title || '(未命名)'}</h3>
              <span className={styles.contributor}>投稿人 ID: {r.contributorId}</span>
            </div>
            <div className={styles.meta}>
              <span>分类：{r.category || '-'}</span>
              <span>地点：{r.place || '-'}</span>
              <span>标签：{r.tags || '-'}</span>
            </div>
            <p className={styles.desc}>{r.description}</p>
            {r.externalLink && <a href={r.externalLink} target="_blank" rel="noreferrer" className={styles.link}>外部链接</a>}
            <textarea
              className={styles.textarea}
              placeholder="审核反馈（通过或拒绝都必须填写）"
              value={feedback[r.id] || ''}
              onChange={e => setFeedback(prev => ({ ...prev, [r.id]: e.target.value }))}
            />
            <div className={styles.actions}>
              <button className={styles.btnApprove} onClick={() => handleReview(r.id, true)}>审核通过</button>
              <button className={styles.btnReject} onClick={() => handleReview(r.id, false)}>审核拒绝</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
