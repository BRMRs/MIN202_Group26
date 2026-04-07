import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './DraftBoxPage.module.css'
import { parseApiError } from '../../common/utils/apiError'

export default function DraftBoxPage() {
  const [drafts, setDrafts] = useState([])
  const [options, setOptions] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [forms, setForms] = useState({})
  const [files, setFiles] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([resourceApi.getDrafts(), resourceApi.getOptions()])
      .then(([d, o]) => {
        setDrafts(d.data)
        setOptions(o.data)
        const init = {}
        d.data.forEach(r => {
          init[r.id] = {
            title: r.title || '', category: r.category || '', place: r.place || '',
            description: r.description || '', tags: r.tags || '',
            copyrightDeclaration: r.copyrightDeclaration || '', externalLink: r.externalLink || ''
          }
        })
        setForms(init)
      })
      .catch(() => setMsg('加载失败，请确认已登录（CONTRIBUTOR角色）'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  const handleSave = async (id) => {
    try {
      if (files[id]) await resourceApi.uploadFile(id, files[id])
      await resourceApi.saveDraft(id, forms[id])
      setMsg(`草稿 #${id} 已保存`)
      setExpanded(null)
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const handleSubmit = async (id) => {
    try {
      if (files[id]) await resourceApi.uploadFile(id, files[id])
      await resourceApi.saveDraft(id, forms[id])
      await resourceApi.submit(id)
      setMsg(`草稿 #${id} 已提交审核，管理员可在「资源审核」页面查看。`)
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除此草稿？')) return
    try {
      await resourceApi.deleteDraft(id)
      setMsg('草稿已删除')
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const refresh = () => {
    resourceApi.getDrafts().then(r => setDrafts(r.data))
  }

  const statusLabel = { DRAFT: '草稿', REJECTED: '已拒绝' }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>草稿箱</h2>
        {msg && <div className={styles.msg}>{msg}</div>}
        {loading && <p className={styles.muted}>加载中...</p>}
        {!loading && drafts.length === 0 && <p className={styles.muted}>暂无草稿</p>}
        {drafts.map(r => (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardHeader} onClick={() => toggle(r.id)}>
              <span><b>#{r.id}</b> {r.title || '(未命名草稿)'}</span>
              <span className={styles.meta}>
                <span className={r.status === 'REJECTED' ? styles.badgeRejected : styles.badgeDraft}>
                  {statusLabel[r.status] || r.status}
                </span>
                {expanded === r.id ? '▲ 收起' : '▼ 展开编辑'}
              </span>
            </div>

            {r.reviewFeedback && (
              <div className={styles.feedback}>审核反馈：{r.reviewFeedback}</div>
            )}

            {expanded === r.id && options && forms[r.id] && (
              <div className={styles.body}>
                <DraftForm
                  form={forms[r.id]}
                  setForm={(updater) => setForms(prev => ({ ...prev, [r.id]: typeof updater === 'function' ? updater(prev[r.id]) : updater }))}
                  options={options}
                  file={files[r.id]}
                  setFile={(f) => setFiles(prev => ({ ...prev, [r.id]: f }))}
                />
                <div className={styles.actions}>
                  <button className={styles.btnSecondary} onClick={() => handleSave(r.id)}>保存草稿</button>
                  <button className={styles.btnPrimary} onClick={() => handleSubmit(r.id)}>提交审核</button>
                  <button className={styles.btnDanger} onClick={() => handleDelete(r.id)}>删除草稿</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  )
}