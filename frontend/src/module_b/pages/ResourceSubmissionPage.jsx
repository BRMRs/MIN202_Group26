import { useState, useEffect } from 'react'
import { resourceApi } from '../api/resourceApi'
import DraftForm from '../components/DraftForm'
import styles from './ResourceSubmissionPage.module.css'
import api from '../../common/api/client'

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
  const [token, setToken] = useState(() => sessionStorage.getItem('authToken') || '')
  const [loginForm, setLoginForm] = useState({ username: 'contributor', password: '123456' })
  const [loginMsg, setLoginMsg] = useState('')

  const handleLogin = async () => {
    try {
      console.log('Attempting login with:', loginForm)
      const res = await api.post('/auth/login', loginForm)
      console.log('Login response:', res)
      const t = res.data.token
      sessionStorage.setItem('authToken', t)
      setToken(t)
      setLoginMsg('')
    } catch (e) {
      console.error('Login error:', e)
      setLoginMsg(e.response?.data?.error || e.response?.data?.message || e.message || '登录失败')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('authToken')
    setToken('')
    setOptions(null)
  }

  useEffect(() => {
    if (!token) return
    resourceApi.getOptions()
      .then(r => setOptions(r.data))
      .catch(() => { setMsg('登录已失效，请重新登录'); handleLogout() })
  }, [token])

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
    if (!token) { setLoginMsg('请先登录'); return }
    setSaving(true)
    try {
      const { data: draft } = await resourceApi.createDraft()
      if (file) await resourceApi.uploadFile(draft.id, file)
      await resourceApi.saveDraft(draft.id, form)
      setMsg('草稿已保存！')
      setTimeout(() => setMsg(''), 1500)
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
          {token && <button onClick={handleLogout} style={{marginLeft:12,padding:'4px 12px',cursor:'pointer'}}>退出登录</button>}
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2>提交遗产资源</h2>

          {!token && (
            <div style={{marginBottom:16,padding:12,border:'1px solid #d0d7e2',borderRadius:8,background:'#f8fafc'}}>
              <div style={{marginBottom:8,fontWeight:600}}>请先登录（CONTRIBUTOR 角色）</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <input value={loginForm.username} onChange={e=>setLoginForm(p=>({...p,username:e.target.value}))} placeholder="用户名" style={{padding:'6px 10px',border:'1px solid #d0d7e2',borderRadius:6}}/>
                <input value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} type="password" placeholder="密码" style={{padding:'6px 10px',border:'1px solid #d0d7e2',borderRadius:6}}/>
                <button onClick={handleLogin} style={{padding:'6px 16px',background:'#1f6feb',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>登录</button>
              </div>
              {loginMsg && <div style={{color:'#cf222e',fontSize:13,marginTop:6}}>{loginMsg}</div>}
            </div>
          )}

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

          {token && (
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button className={styles.btnPrimary} onClick={handleSaveAndSubmit} disabled={saving}>
                {saving ? '处理中...' : '提交审核'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}