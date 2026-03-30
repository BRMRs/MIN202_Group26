import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './ResourceSubmissionPage.module.css'

export default function ResourceSubmissionPage() {
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
    resourceApi.getOptions()
      .then(r => setOptions(r.data))
      .catch(() => setMsg('无法加载选项，请确认已登录（CONTRIBUTOR角色）'))
  }, [])

  const validate = () => {
    const errs = []
    if (!form.title.trim()) errs.push('标题 (Title)')
    if (!form.category) errs.push('分类 (Category)')
    if (!form.place) errs.push('地点 (Place)')
    if (!form.description.trim()) errs.push('描述 (Description)')
    if (!form.tags.trim()) errs.push('标签 (Tags)')
    if (!form.copyrightDeclaration) errs.push('版权声明 (Copyright)')
    if (!file && !form.externalLink.trim()) errs.push('文件或外链 (File or Link)')
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
      setMsg('提交成功！资源已进入审核队列。')
      setForm({ title: '', category: '', place: '', description: '', tags: '', copyrightDeclaration: '', externalLink: '' })
      setFile(null)
    } catch (e) {
      setMsg(e.response?.data?.error || '操作失败，请重试')
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
      setMsg('草稿已保存！')
    } catch (e) {
      setMsg(e.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
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
        <div className={styles.card}>
          <h2>提交遗产资源</h2>
          <p className={styles.hint}>请先在 sessionStorage 中设置 userId 和 userRole（CONTRIBUTOR）</p>

          {errors.length > 0 && (
            <div className={styles.errorBox}>
              <strong>以下字段为必填：</strong>
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

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
              保存草稿
            </button>
            <button className={styles.btnPrimary} onClick={handleSaveAndSubmit} disabled={saving}>
              {saving ? '处理中...' : '提交审核'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
