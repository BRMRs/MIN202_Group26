import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './ResourceSubmissionPage.module.css'
import { useAuthContext } from '../../common/context/AuthContext'

export default function ResourceSubmissionPage() {
  const { user, isAuthenticated } = useAuthContext()
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
      .catch(() => setMsg('Failed to load options'))
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
      setMsg('Submitted successfully! Resource is now pending review.')
      setForm({ title: '', category: '', place: '', description: '', tags: '', copyrightDeclaration: '', externalLink: '' })
      setFile(null)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Operation failed, please retry')
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
      setMsg('Draft saved!')
      setTimeout(() => setMsg(''), 1500)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Community Heritage</h1>
        <nav>
          <a href="/module-b/submit">Submit Resource</a>
          <a href="/module-b/drafts">Drafts</a>
          <a href="/module-b/review">Review</a>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2>Submit Heritage Resource</h2>

          {!isAuthenticated && (
            <div style={{marginBottom:16,padding:12,border:'1px solid #d0d7e2',borderRadius:8,background:'#f8fafc'}}>
              <p>Please <a href="/login">log in</a> as a Contributor to submit resources.</p>
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
              <button className={styles.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button className={styles.btnPrimary} onClick={handleSaveAndSubmit} disabled={saving}>
                {saving ? 'Processing...' : 'Submit for Review'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
