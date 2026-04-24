import { useState, useEffect, useRef } from 'react'
import { resourceApi } from '../api/resourceApi'
import { getReviewHistory } from '../../module_c/api/reviewApi'
import DraftForm from '../components/DraftForm'
import styles from './DraftBoxPage.module.css'
import { parseApiError } from '../../common/utils/apiError'
import { formStateFromDraftRow } from '../utils/draftFormState'
import { pickLatestRejectionText } from '../utils/reviewFeedback'

const parseTags = (input) => {
  const raw = String(input || '').trim()
  if (!raw) return []
  if (!raw.includes('#')) return [raw]
  return raw
    .split('#')
    .slice(1)
    .map(tag => tag.trim())
    .filter(Boolean)
}

export default function DraftBoxPage() {
  const [drafts, setDrafts] = useState([])
  const [options, setOptions] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [forms, setForms] = useState({})
  const [files, setFiles] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  /** Latest rejection note from Module C (/reviews/{id}/feedback). */
  const [rejectionFromReviewApi, setRejectionFromReviewApi] = useState({})
  const [rejectionFetchLoading, setRejectionFetchLoading] = useState(false)
  const [externalLinkErrors, setExternalLinkErrors] = useState({})
  const externalLinkTimerRef = useRef({})
  const [tagErrors, setTagErrors] = useState({})
  const tagErrorTimerRef = useRef({})

  const rebuildForms = (draftRows, opts) => {
    const init = {}
    draftRows.forEach(r => {
      init[r.id] = formStateFromDraftRow(r, opts)
    })
    setForms(init)
  }

  useEffect(() => {
    Promise.all([resourceApi.getDrafts(), resourceApi.getOptions()])
      .then(([d, o]) => {
        setDrafts(d.data)
        setOptions(o.data)
        rebuildForms(d.data, o.data)
        window.dispatchEvent(new CustomEvent('heritage-contributor-drafts-changed'))
      })
      .catch(() => setMsg('Failed to load. Please confirm you are logged in as a CONTRIBUTOR.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const rejected = drafts.filter(d => d.status === 'REJECTED')
    if (rejected.length === 0) {
      setRejectionFromReviewApi({})
      setRejectionFetchLoading(false)
      return undefined
    }

    let cancelled = false
    setRejectionFetchLoading(true)
    Promise.all(
      rejected.map(d =>
        getReviewHistory(d.id)
          .then(res => {
            const list = res.data?.data
            const text = pickLatestRejectionText(Array.isArray(list) ? list : [])
            return { id: d.id, text }
          })
          .catch(() => ({ id: d.id, text: null }))
      )
    )
      .then(rows => {
        if (cancelled) return
        const map = {}
        rows.forEach(({ id, text }) => {
          if (text) map[id] = text
        })
        setRejectionFromReviewApi(map)
      })
      .finally(() => {
        if (!cancelled) setRejectionFetchLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [drafts])

  const getDisplayRejectionReason = r => {
    if (r.status !== 'REJECTED') return null
    return rejectionFromReviewApi[r.id] ?? r.reviewFeedback ?? null
  }

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  const hasInvalidExternalLinks = (form) => {
    const links = form?.externalLinks || []
    return links.some(link => link && !/^https?:\/\//i.test(link))
  }

  const showExternalLinkError = (id) => {
    setExternalLinkErrors(prev => ({ ...prev, [id]: 'External links must start with http or https' }))
    if (externalLinkTimerRef.current[id]) clearTimeout(externalLinkTimerRef.current[id])
    externalLinkTimerRef.current[id] = setTimeout(() => {
      setExternalLinkErrors(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, 2000)
  }

  const showTagError = (id) => {
    setTagErrors(prev => ({ ...prev, [id]: 'Up to 5 tags only.' }))
    if (tagErrorTimerRef.current[id]) clearTimeout(tagErrorTimerRef.current[id])
    tagErrorTimerRef.current[id] = setTimeout(() => {
      setTagErrors(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, 2000)
  }

  const handleSave = async (id) => {
    if (hasInvalidExternalLinks(forms[id])) {
      showExternalLinkError(id)
      return
    }
    const tagCount = parseTags(forms[id]?.tags).length
    if (tagCount > 5) {
      showTagError(id)
      return
    }
    try {
      if (files[id]?.length) await resourceApi.uploadFiles(id, files[id])
      await resourceApi.saveDraft(id, forms[id])
      setFiles(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setMsg(`Draft #${id} saved`)
      setExpanded(null)
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const handleSubmit = async (id) => {
    if (hasInvalidExternalLinks(forms[id])) {
      showExternalLinkError(id)
      return
    }
    const tagCount = parseTags(forms[id]?.tags).length
    if (tagCount > 5) {
      showTagError(id)
      return
    }
    try {
      if (files[id]?.length) await resourceApi.uploadFiles(id, files[id])
      await resourceApi.saveDraft(id, forms[id])
      await resourceApi.submit(id)
      setFiles(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setMsg(`Draft #${id} submitted for review.`)
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft?')) return
    try {
      await resourceApi.deleteDraft(id)
      setMsg('Draft deleted')
      refresh()
    } catch (e) {
      setMsg(parseApiError(e))
    }
  }

  const refresh = () => {
    resourceApi.getDrafts().then(r => {
      setDrafts(r.data)
      if (options) rebuildForms(r.data, options)
      window.dispatchEvent(new CustomEvent('heritage-contributor-drafts-changed'))
    })
  }

  const statusLabel = { DRAFT: 'Draft', REJECTED: 'Rejected' }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h2>Drafts</h2>
        <p className={styles.muted} style={{ marginBottom: 16 }}>
        </p>
        {msg && <div className={styles.msg}>{msg}</div>}
        {loading && <p className={styles.muted}>Loading...</p>}
        {!loading && drafts.length === 0 && <p className={styles.muted}>No drafts yet</p>}
        {drafts.map(r => {
          const reason = getDisplayRejectionReason(r)
          return (
          <div key={r.id} className={styles.card}>
            <div className={styles.cardHeader} onClick={() => toggle(r.id)}>
              <span><b>#{r.id}</b> {r.title || '(Untitled draft)'}</span>
              <span className={styles.meta}>
                <span className={r.status === 'REJECTED' ? styles.badgeRejected : styles.badgeDraft}>
                  {statusLabel[r.status] || r.status}
                </span>
                {expanded === r.id ? '▲ Collapse' : '▼ Expand'}
              </span>
            </div>

            {r.status === 'REJECTED' && expanded !== r.id && (
              reason ? (
                <div className={styles.feedback}>
                  <strong>Admin review note</strong>
                  ：{reason}
                </div>
              ) : rejectionFetchLoading ? (
                <div className={styles.feedbackMuted}>Loading review note...</div>
              ) : (
                <div className={styles.feedbackMuted}>No review note yet (expand to retry loading)</div>
              )
            )}

            {expanded === r.id && options && forms[r.id] && (
              <div className={styles.body}>
                {r.status === 'REJECTED' && (
                  reason ? (
                    <div className={styles.rejectionCallout}>
                      <strong>Rejection reason</strong>
                      {reason}
                    </div>
                  ) : rejectionFetchLoading ? (
                    <div className={styles.rejectionCallout}>
                      <strong>Rejection reason</strong>
                      Loading from review history...
                    </div>
                  ) : (
                    <div className={styles.rejectionCallout}>
                      <strong>Rejection reason</strong>
                      No note found in review history. Refresh the page or contact admin if needed.
                    </div>
                  )
                )}
                <DraftForm
                  form={forms[r.id]}
                  setForm={(updater) =>
                    setForms(prev => ({
                      ...prev,
                      [r.id]: typeof updater === 'function' ? updater(prev[r.id]) : updater
                    }))
                  }
                  options={options}
                  files={files[r.id]}
                  setFiles={(next) => {
                    if (typeof next === 'function') {
                      setFiles(prev => ({ ...prev, [r.id]: next(prev[r.id] || []) }))
                    } else {
                      setFiles(prev => ({ ...prev, [r.id]: next }))
                    }
                  }}
                  serverMedia={r.mediaFiles || []}
                  externalLinkError={externalLinkErrors[r.id] || ''}
                  tagSubmitError={tagErrors[r.id] || ''}
                />
                <div className={styles.actions}>
                  <button type="button" className={styles.btnSecondary} onClick={() => handleSave(r.id)}>Save draft</button>
                  <button type="button" className={styles.btnPrimary} onClick={() => handleSubmit(r.id)}>Submit for review</button>
                  <button type="button" className={styles.btnDanger} onClick={() => handleDelete(r.id)}>Delete draft</button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </main>
    </div>
  )
}
