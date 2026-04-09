import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './ResourceSubmissionPage.module.css'
import { useAuthContext } from '../../common/context/AuthContext'
import { parseApiError } from '../../common/utils/apiError'

export default function ResourceSubmissionPage() {
  const { isAuthenticated } = useAuthContext()
  const [options, setOptions] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState([])
  const [form, setForm] = useState({
    title: '', category: '', place: '', description: '',
    tags: '', copyrightDeclaration: '', externalLink: ''
  })
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return
    resourceApi.getOptions()
      .then(r => setOptions(r.data))
      .catch(() => setMsg('Failed to load options. Please refresh and try again.'))
  }, [isAuthenticated])

  const validate = () => {
    const errs = []
    if (!form.title.trim()) errs.push('Title')
    if (!form.category) errs.push('Category')
    if (!form.place) errs.push('Place')
    if (!form.description.trim()) errs.push('Description')
    if (!form.tags.trim()) errs.push('Tags')
    if (!form.copyrightDeclaration) errs.push('Copyright Declaration')
    if (!file && !form.externalLink.trim()) errs.push('File or External Link')
    return errs
  }

  const handleSaveAndSubmit = async () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setSaving(true)
    try {
      const { data: draft } = await resourceApi.createDraft()
      if (file) await resourceApi.uploadFile(draft.id, file)
      await resourceApi.saveDraft(draft.id, form)
      await resourceApi.submit(draft.id)
      setMsg('Resource submitted successfully! It is now pending review by an administrator.')
      setForm({ title: '', category: '', place: '', description: '', tags: '', copyrightDeclaration: '', externalLink: '' })
      setFile(null)
    } catch (e) {
      setMsg(parseApiError(e))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const { data: draft } = await resourceApi.createDraft()
      if (file) await resourceApi.uploadFile(draft.id, file)
      await resourceApi.saveDraft(draft.id, form)
      setMsg('Draft saved.')
      setTimeout(() => setMsg(''), 2000)
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
              file={file}
              setFile={setFile}
            />
          )}

          {isAuthenticated && (
            <div className={styles.actions}>
              <button type="button" className={styles.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSaveAndSubmit} disabled={saving}>
                {saving ? 'Submitting…' : 'Submit Resource'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
