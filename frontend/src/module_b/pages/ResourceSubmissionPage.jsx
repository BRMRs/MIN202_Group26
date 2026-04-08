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
      .catch(() => setMsg('选项加载失败，请稍后重试'))
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
      setMsg('提交成功！资源已进入待审核状态，管理员可在「资源审核」页面（Module C）进行审核。')
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
      setMsg('草稿已保存')
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
        <div className={styles.card}>
          <h2>提交文化遗产资源</h2>
          <p className={styles.hint}>填写信息后点击「提交资源」将进入待审核队列；管理员在 Module C 的「资源审核」界面处理，不再使用旧版 Module B 审核页。</p>

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
              <button type="button" className={styles.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
                {saving ? '处理中…' : '保存草稿'}
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSaveAndSubmit} disabled={saving}>
                {saving ? '提交中…' : '提交资源'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
