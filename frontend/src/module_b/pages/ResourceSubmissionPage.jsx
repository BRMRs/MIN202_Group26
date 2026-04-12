import { useState, useEffect, useRef } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './ResourceSubmissionPage.module.css'
import { useAuthContext } from '../../common/context/AuthContext'
import { parseApiError } from '../../common/utils/apiError'

const emptyForm = () => ({
  title: '',
  categoryId: '',
  staleCategoryName: null,
  place: '',
  description: '',
  tags: '',
  copyrightDeclaration: '',
  externalLinks: [],
  province: ''
})

export default function ResourceSubmissionPage() {
  const { isAuthenticated } = useAuthContext()
  const [options, setOptions] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState([])
  const [externalLinkError, setExternalLinkError] = useState('')
  const externalLinkTimerRef = useRef(null)
  const [tagSubmitError, setTagSubmitError] = useState('')
  const tagErrorTimerRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState([])

  useEffect(() => {
    if (!isAuthenticated) return
    resourceApi.getOptions()
      .then(r => setOptions(r.data))
      .catch(() => setMsg('Failed to load options. Please try again.'))
  }, [isAuthenticated])

  const validate = () => {
    const errs = []
    if (!form.title.trim()) errs.push('Title')
    if (form.categoryId === '' || form.categoryId == null) errs.push('Category')
    if (!form.place) errs.push('Place')
    if (!form.description.trim()) errs.push('Description')
    if (!form.tags.trim()) errs.push('Tags')
    if (!form.copyrightDeclaration) errs.push('Copyright Declaration')
    const links = form.externalLinks || []
    const invalidLinks = links.filter(link => link && !/^https?:\/\//i.test(link))
    if (invalidLinks.length > 0) errs.push('External Link')
    if (form.tags && !form.tags.trim().startsWith('#')) errs.push('Tag Prefix')
    const validLinks = links.filter(link => link && /^https?:\/\//i.test(link))
    if ((files?.length || 0) === 0 && validLinks.length === 0) errs.push('File or External Link')
    return errs
  }

  const showExternalLinkError = () => {
    setExternalLinkError('External links must start with http or https')
    if (externalLinkTimerRef.current) clearTimeout(externalLinkTimerRef.current)
    externalLinkTimerRef.current = setTimeout(() => setExternalLinkError(''), 2000)
  }

  const showTagSubmitError = () => {
    setTagSubmitError('Tags must start with #')
    if (tagErrorTimerRef.current) clearTimeout(tagErrorTimerRef.current)
    tagErrorTimerRef.current = setTimeout(() => setTagSubmitError(''), 2000)
  }

  const resetComposer = () => {
    setForm(emptyForm())
    setFiles([])
    setErrors([])
    setExternalLinkError('')
    setTagSubmitError('')
  }

  const handleSubmitForReview = async () => {
    const errs = validate()
    if (errs.length > 0) {
      setErrors(errs)
      if (errs.includes('External Link')) showExternalLinkError()
      if (errs.includes('Tag Prefix')) showTagSubmitError()
      return
    }
    setErrors([])
    setSaving(true)
    try {
      const { data: draft } = await resourceApi.createDraft()
      if (files?.length) await resourceApi.uploadFiles(draft.id, files)
      await resourceApi.saveDraft(draft.id, form)
      await resourceApi.submit(draft.id)
      setMsg('Submitted successfully! The resource is now in the review queue.')
      resetComposer()
    } catch (e) {
      setMsg(parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraftAndStartNew = async () => {
    const errs = validate()
    if (errs.includes('External Link')) {
      showExternalLinkError()
      return
    }
    if (errs.includes('Tag Prefix')) {
      showTagSubmitError()
      return
    }
    setSaving(true)
    try {
      const { data: draft } = await resourceApi.createDraft()
      if (files?.length) await resourceApi.uploadFiles(draft.id, files)
      await resourceApi.saveDraft(draft.id, form)
      setMsg('Draft saved. Continue it from Drafts. Started a new blank form.')
      resetComposer()
      window.dispatchEvent(new CustomEvent('heritage-contributor-drafts-changed'))
      setTimeout(() => setMsg(''), 1500)
    } catch (e) {
      setMsg(parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <p className={styles.pageEyebrow}>Community Heritage Platform</p>
          <h1 className={styles.pageTitle}>Submit a Heritage Resource</h1>
          <p className={styles.pageSubtitle}>
            Fill in the details below and submit for administrator review.
          </p>
        </div>

        <div className={styles.card}>
          {!isAuthenticated && (
            <div className={styles.authNotice}>
              Please <a href="/login">log in</a> as a Contributor to submit resources.
            </div>
          )}

          {errors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>Required fields missing:</strong>
              <ul>{errors.map(e => <li key={e}>{e}</li>)}</ul>
            </div>
          )}

          {msg && <div className={styles.msg}>{msg}</div>}

          {options && (
            <DraftForm
              form={form}
              setForm={setForm}
              options={options}
              files={files}
              setFiles={setFiles}
              externalLinkError={externalLinkError}
              tagSubmitError={tagSubmitError}
            />
          )}

          {isAuthenticated && (
            <div className={styles.actions}>
              <button type="button" className={styles.btnSecondary} onClick={handleSaveDraftAndStartNew} disabled={saving}>
                {saving ? 'Processing…' : 'Save draft and start new'}
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmitForReview} disabled={saving}>
                {saving ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
