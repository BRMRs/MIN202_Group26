import { useState, useRef } from 'react'
import './App.css'

async function req(url, opts = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(e.error || '请求失败')
  }
  return res.json()
}

export default function App() {
  const [token, setToken] = useState('')
  const [userInfo, setUserInfo] = useState({})
  const [loginForm, setLoginForm] = useState({ username: 'contributor', password: '123456' })
  const [drafts, setDrafts] = useState([])
  const [mine, setMine] = useState([])
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [options, setOptions] = useState({ categories: [], places: [], recommendedTags: [], copyrightOptions: [], titleMaxLength: 30, descriptionMaxLength: 2000, allowedFileExtensions: ['.docx','.pdf','.txt'] })
  const [message, setMessage] = useState('')
  const [pickedFiles, setPickedFiles] = useState({})
  const [adminFeedback, setAdminFeedback] = useState({})
  const [validationErrors, setValidationErrors] = useState([])
  const [view, setView] = useState('drafts')
  const [expandedDraft, setExpandedDraft] = useState(null)
  const [tagLimitHit, setTagLimitHit] = useState({})
  const [newDraft, setNewDraft] = useState({ title:'',category:'',place:'',description:'',tags:'',copyrightDeclaration:'',externalLink:'',filePath:'' })
  const [newTagLimitHit, setNewTagLimitHit] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const vtRef = useRef(null)

  const H = (json=true, tok=token) => { const h={'X-Auth-Token':tok}; if(json) h['Content-Type']='application/json'; return h }

  const reload = async (info=userInfo, tok=token) => {
    if (!tok) return
    try {
      if (info.role==='CONTRIBUTOR') {
        const [o,d,m,a] = await Promise.all([
          req('/api/resources/options',{headers:H(false,tok)}),
          req('/api/resources/drafts',{headers:H(false,tok)}),
          req('/api/resources/mine',{headers:H(false,tok)}),
          req('/api/resources/approved',{headers:H(false,tok)}),
        ])
        setOptions(o); setDrafts(d); setMine(m); setApproved(a)
      } else if (info.role==='ADMIN') {
        setPending(await req('/api/resources/pending',{headers:H(false,tok)}))
      } else if (info.role==='VIEWER') {
        setApproved(await req('/api/resources/approved',{headers:H(false,tok)}))
      }
    } catch(e) { setMessage(e.message) }
  }

  const login = async () => {
    try {
      const r = await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(loginForm)})
      setToken(r.token); setUserInfo(r); setMessage('登录成功'); await reload(r,r.token)
    } catch(e) { setMessage(e.message) }
  }

  const logout = () => { setToken(''); setUserInfo({}); setDrafts([]); setMine([]); setPending([]); setApproved([]); setMessage('已退出') }

  const tc = r => !r.tags?.trim() ? 0 : r.tags.trim().split(/\s+/).filter(t=>t.startsWith('#')&&t.length>1).length
  const ntc = !newDraft.tags?.trim() ? 0 : newDraft.tags.trim().split(/\s+/).filter(t=>t.startsWith('#')&&t.length>1).length

  const addTag = r => {
    if (tc(r)>=5) { setTagLimitHit(p=>({...p,[r.id]:true})); setTimeout(()=>setTagLimitHit(p=>({...p,[r.id]:false})),3000); return }
    const cur=r.tags||''; upd(r.id,'tags',cur.trim()?cur.trimEnd()+' #':'#')
  }
  const addNewTag = () => {
    if (ntc>=5) { setNewTagLimitHit(true); setTimeout(()=>setNewTagLimitHit(false),3000); return }
    const cur=newDraft.tags||''; setNewDraft(p=>({...p,tags:cur.trim()?cur.trimEnd()+' #':'#'}))
  }

  const upd = (id,k,v) => setDrafts(p=>p.map(d=>d.id===id?{...d,[k]:v}:d))

  const createDraft = () => { setNewDraft({title:'',category:'',place:'',description:'',tags:'',copyrightDeclaration:'',externalLink:'',filePath:''}); setPickedFiles(p=>({...p,new:null})); setSaveSuccessMsg(''); setView('new') }

  // 创建并保存草稿，返回新草稿的 id
  const doCreateAndSave = async () => {
    const c = await req('/api/resources',{method:'POST',headers:H(false)})
    if (pickedFiles['new']) {
      const f=new FormData(); f.append('file',pickedFiles['new'])
      const r=await fetch(`/api/resources/${c.id}/file`,{method:'POST',headers:H(false),body:f})
      if(r.ok){const u=await r.json();setNewDraft(p=>({...p,filePath:u.filePath||''}))}
    }
    await req(`/api/resources/${c.id}/save-draft`,{method:'POST',headers:H(),body:JSON.stringify({...newDraft,id:c.id})})
    return c.id
  }

  const saveNewDraft = async () => {
    setSaving(true)
    try {
      await doCreateAndSave()
      await reload()
      setSaveSuccessMsg('保存成功 ✓'); setTimeout(()=>setSaveSuccessMsg(''),1500)
      setExpandedDraft(null); setTimeout(()=>setView('drafts'),400)
    } catch(e) {
      alert('保存失败：' + e.message)
      setMessage(e.message)
    } finally { setSaving(false) }
  }

  // 新建页面直接提交审核（先保存草稿，再校验，再提交）
  const submitNew = async () => {
    const e=[]
    if (!newDraft.title?.trim()) e.push('标题 (Title)')
    if (!newDraft.category?.trim()) e.push('分类 (Category)')
    if (!newDraft.tags?.trim()) e.push('标签 (Tag)')
    if (!newDraft.place?.trim()) e.push('地点 (Place)')
    if (!newDraft.description?.trim()) e.push('描述 (Description)')
    if (!pickedFiles['new'] && !newDraft.filePath && !newDraft.externalLink?.trim()) e.push('文件上传或外部链接 (File Upload or External Link)')
    if (!newDraft.copyrightDeclaration?.trim()) e.push('版权声明 (Copyright or Usage Declaration)')
    if (e.length>0){showErrors(e);return}
    try {
      const id = await doCreateAndSave()
      await req(`/api/resources/${id}/submit`,{method:'POST',headers:H(false)})
      setMessage('已提交审核'); await reload(); setView('mine')
    } catch(e) { setMessage(e.message) }
  }

  const saveDraft = async r => {
    try {
      await req(`/api/resources/${r.id}/save-draft`,{method:'POST',headers:H(),body:JSON.stringify(r)})
      setSaveSuccessMsg('保存成功 ✓'); setTimeout(()=>setSaveSuccessMsg(''),1500); setExpandedDraft(null); await reload()
    } catch(e) { setMessage(e.message) }
  }

  const deleteDraft = async id => {
    try { await req(`/api/resources/${id}/draft`,{method:'DELETE',headers:H(false)}); setMessage('草稿已删除'); if(expandedDraft===id)setExpandedDraft(null); await reload() }
    catch(e) { setMessage(e.message) }
  }

  const upload = async (id) => {
    try {
      const file=pickedFiles[id]; if(!file) throw new Error('请先选择文件')
      const f=new FormData(); f.append('file',file)
      const r=await fetch(`/api/resources/${id}/file`,{method:'POST',headers:H(false),body:f})
      if(!r.ok){const e=await r.json().catch(()=>({error:'上传失败'}));throw new Error(e.error||'上传失败')}
      const u=await r.json(); upd(id,'filePath',u.filePath||''); setMessage('文件上传成功')
    } catch(e) { setMessage(e.message) }
  }

  const showErrors = errors => { setValidationErrors(errors); if(vtRef.current)clearTimeout(vtRef.current); vtRef.current=setTimeout(()=>setValidationErrors([]),5000) }

  const submit = async r => {
    const e=[]
    if (!r.title?.trim()) e.push('标题 (Title)')
    if (!r.category?.trim()) e.push('分类 (Category)')
    if (!r.tags?.trim()) e.push('标签 (Tag)')
    if (!r.place?.trim()) e.push('地点 (Place)')
    if (!r.description?.trim()) e.push('描述 (Description)')
    if (!(pickedFiles[r.id]||r.filePath)&&!r.externalLink?.trim()) e.push('文件上传或外部链接 (File Upload or External Link)')
    if (!r.copyrightDeclaration?.trim()) e.push('版权声明 (Copyright or Usage Declaration)')
    if (e.length>0){showErrors(e);return}
    try { await req(`/api/resources/${r.id}/submit`,{method:'POST',headers:H(false)}); setMessage('已提交审核'); await reload() }
    catch(e){setMessage(e.message)}
  }

  const review = async (id, ok) => {
    try { await req(`/api/resources/${id}/review`,{method:'POST',headers:H(),body:JSON.stringify({approved:ok,feedback:adminFeedback[id]||''})}); setMessage(ok?'审核通过并反馈':'审核拒绝并反馈'); await reload() }
    catch(e){setMessage(e.message)}
  }
  const Fields = ({r}) => (<>
    <div className="field-group">
      <div className="field-label-row"><label>标题 <span className="required">*</span></label><span className={(r.title||'').length>=options.titleMaxLength?'char-count warn':'char-count'}>{(r.title||'').length}/{options.titleMaxLength}</span></div>
      <input value={r.title||''} onChange={e=>upd(r.id,'title',e.target.value.slice(0,options.titleMaxLength))} placeholder="请输入标题（30字内）" className="full-width"/>
    </div>
    <div className="row" style={{marginTop:10}}>
      <div className="field-group flex1"><label>分类 <span className="required">*</span></label><select value={r.category||''} onChange={e=>upd(r.id,'category',e.target.value)} className="full-width"><option value="">选择分类</option>{options.categories.map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="field-group flex1"><label>地点 <span className="required">*</span></label><select value={r.place||''} onChange={e=>upd(r.id,'place',e.target.value)} className="full-width"><option value="">选择地点</option>{options.places.map(p=><option key={p}>{p}</option>)}</select></div>
    </div>
    <div className="field-group" style={{marginTop:10}}>
      <div className="field-label-row"><label>描述 <span className="required">*</span></label><span className={(r.description||'').length>=options.descriptionMaxLength?'char-count warn':'char-count'}>{(r.description||'').length}/{options.descriptionMaxLength}</span></div>
      <textarea value={r.description||''} onChange={e=>upd(r.id,'description',e.target.value.slice(0,options.descriptionMaxLength))} placeholder="请输入描述（2000字内）"/>
    </div>
    <div className="field-group" style={{marginTop:10}}>
      <div className="field-label-row"><label>标签 <span className="required">*</span></label><span className="muted" style={{fontSize:12}}>已添加 {tc(r)}/5 个标签</span></div>
      <div className="row" style={{alignItems:'center',gap:8}}><input value={r.tags||''} onChange={e=>upd(r.id,'tags',e.target.value)} placeholder="标签自动以 # 开头，空格分隔" className="flex1"/><button className="secondary tag-btn" onClick={()=>addTag(r)}>+ 标签</button></div>
      <div className="muted" style={{fontSize:12,marginTop:4}}>推荐标签：{options.recommendedTags.join('、')}</div>
      {tagLimitHit[r.id]&&<div className="tag-warn">最多可以输入 5 个标签</div>}
    </div>
    <div className="field-group" style={{marginTop:10}}><label>版权声明 <span className="required">*</span></label><select value={r.copyrightDeclaration||''} onChange={e=>upd(r.id,'copyrightDeclaration',e.target.value)} className="full-width"><option value="">选择版权声明</option>{options.copyrightOptions.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="field-group" style={{marginTop:10}}><label>外部链接 <span className="required">*</span> <span className="muted">(与文件上传二选一)</span></label><input value={r.externalLink||''} onChange={e=>upd(r.id,'externalLink',e.target.value)} placeholder="https://..." className="full-width"/></div>
    <div className="field-group" style={{marginTop:10}}>
      <label>上传文件 <span className="required">*</span> <span className="muted">(与外链二选一)</span></label>
      <div className="row"><input type="file" onChange={e=>setPickedFiles(p=>({...p,[r.id]:e.target.files[0]}))} className="flex1"/><button className="secondary" onClick={()=>upload(r.id)}>上传文件</button></div>
      <div className="muted" style={{fontSize:12}}>允许格式：{options.allowedFileExtensions.join(', ')}</div>
      <div className="muted" style={{fontSize:12}}>已上传：{r.filePath||'未上传'}</div>
    </div>
  </>)

  return (
    <div className="container">
      {!token&&<div className="card"><h2>登录</h2><div className="row"><input value={loginForm.username} onChange={e=>setLoginForm(p=>({...p,username:e.target.value}))} placeholder="用户名（contributor/viewer/admin）"/><input value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))} type="password" placeholder="密码（默认 123456）"/><button onClick={login}>登录</button></div><div className="muted">系统会根据登录账号自动识别角色，不再手动选择角色。</div></div>}

      {token&&<div className="card"><h2>Community Heritage Resource Workflow</h2><div className="row"><span>当前用户：{userInfo.username} / 角色：{userInfo.role}</span><button onClick={()=>reload()}>刷新数据</button><button className="secondary" onClick={logout}>退出登录</button></div></div>}

      {token&&userInfo.role==='CONTRIBUTOR'&&<div className="card">
        <h3>Contributor 操作</h3>
        <div className="row" style={{alignItems:'center'}}><button onClick={createDraft}>新建草稿</button><button className={view==='drafts'?'secondary active':'secondary'} onClick={()=>setView('drafts')}>草稿箱 ({drafts.length})</button><button className={view==='mine'?'secondary active':'secondary'} onClick={()=>setView('mine')}>我的全部资源</button></div>

        {view==='new'&&<div><h4>新建草稿</h4><div className="resource-item">
          <div className="field-group"><div className="field-label-row"><label>标题 <span className="required">*</span></label><span className={newDraft.title.length>=options.titleMaxLength?'char-count warn':'char-count'}>{newDraft.title.length}/{options.titleMaxLength}</span></div><input value={newDraft.title} onChange={e=>setNewDraft(p=>({...p,title:e.target.value.slice(0,options.titleMaxLength)}))} placeholder="请输入标题（30字内）" className="full-width"/></div>
          <div className="row" style={{marginTop:10}}><div className="field-group flex1"><label>分类 <span className="required">*</span></label><select value={newDraft.category} onChange={e=>setNewDraft(p=>({...p,category:e.target.value}))} className="full-width"><option value="">选择分类</option>{options.categories.map(c=><option key={c}>{c}</option>)}</select></div><div className="field-group flex1"><label>地点 <span className="required">*</span></label><select value={newDraft.place} onChange={e=>setNewDraft(p=>({...p,place:e.target.value}))} className="full-width"><option value="">选择地点</option>{options.places.map(p=><option key={p}>{p}</option>)}</select></div></div>
          <div className="field-group" style={{marginTop:10}}><div className="field-label-row"><label>描述 <span className="required">*</span></label><span className={newDraft.description.length>=options.descriptionMaxLength?'char-count warn':'char-count'}>{newDraft.description.length}/{options.descriptionMaxLength}</span></div><textarea value={newDraft.description} onChange={e=>setNewDraft(p=>({...p,description:e.target.value.slice(0,options.descriptionMaxLength)}))} placeholder="请输入描述（2000字内）"/></div>
          <div className="field-group" style={{marginTop:10}}><div className="field-label-row"><label>标签 <span className="required">*</span></label><span className="muted" style={{fontSize:12}}>已添加 {ntc}/5 个标签</span></div><div className="row" style={{alignItems:'center',gap:8}}><input value={newDraft.tags} onChange={e=>setNewDraft(p=>({...p,tags:e.target.value}))} placeholder="标签以 # 开头，空格分隔" className="flex1"/><button className="secondary tag-btn" onClick={addNewTag}>+ 标签</button></div><div className="muted" style={{fontSize:12,marginTop:4}}>推荐标签：{options.recommendedTags.join('、')}</div>{newTagLimitHit&&<div className="tag-warn">最多可以输入 5 个标签</div>}</div>
          <div className="field-group" style={{marginTop:10}}><label>版权声明 <span className="required">*</span></label><select value={newDraft.copyrightDeclaration} onChange={e=>setNewDraft(p=>({...p,copyrightDeclaration:e.target.value}))} className="full-width"><option value="">选择版权声明</option>{options.copyrightOptions.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="field-group" style={{marginTop:10}}><label>外部链接 <span className="required">*</span> <span className="muted">(与文件上传二选一)</span></label><input value={newDraft.externalLink} onChange={e=>setNewDraft(p=>({...p,externalLink:e.target.value}))} placeholder="https://..." className="full-width"/></div>
          <div className="field-group" style={{marginTop:10}}><label>上传文件 <span className="required">*</span> <span className="muted">(与外链二选一)</span></label><div className="row"><input type="file" onChange={e=>setPickedFiles(p=>({...p,new:e.target.files[0]}))} className="flex1"/><button className="secondary" onClick={()=>setMessage('文件已选择，保存草稿时将一并上传')}>上传文件</button></div><div className="muted" style={{fontSize:12}}>允许格式：{options.allowedFileExtensions.join(', ')}</div><div className="muted" style={{fontSize:12}}>已上传：{newDraft.filePath||'未上传'}</div></div>
          <div className="row" style={{marginTop:14,alignItems:'center'}}><button className="secondary" onClick={saveNewDraft} disabled={saving}>{saving?'保存中...':'保存草稿'}</button><button onClick={submitNew} disabled={saving}>提交审核</button>{saveSuccessMsg&&<span className="save-success">{saveSuccessMsg}</span>}<button className="secondary" onClick={()=>setView('drafts')} disabled={saving}>取消</button></div>
        </div></div>}

        {view==='drafts'&&<div><h4>草稿箱</h4>
          {drafts.length===0&&<div className="muted">暂无草稿，点击「新建草稿」创建。</div>}
          {drafts.map(r=><div key={r.id} className="resource-item">
            <div className="draft-header" onClick={()=>setExpandedDraft(expandedDraft===r.id?null:r.id)}>
              <span><b>#{r.id}</b> {r.title||'(未命名草稿)'}</span>
              <span className="draft-meta">状态：{r.status}  |  {expandedDraft===r.id?'▲ 收起':'▼ 展开编辑'}</span>
            </div>
            <div className="muted" style={{fontSize:12}}>审核反馈：{r.reviewFeedback||'无'}</div>
            {expandedDraft===r.id&&<div className="draft-body">
              <Fields r={r}/>
              <div className="row" style={{marginTop:14}}>
                <button className="secondary" onClick={()=>saveDraft(r)}>保存草稿</button>
                <button onClick={()=>submit(r)}>提交审核</button>
                <button className="danger" onClick={()=>deleteDraft(r.id)}>删除草稿</button>
              </div>
            </div>}
          </div>)}
        </div>}

        {view==='mine'&&<div><h4>我的全部资源</h4>
          {mine.map(r=><div key={'mine-'+r.id} className="resource-item"><div><b>#{r.id} {r.title||'(未命名)'}</b> 状态：{r.status}</div><div className="muted">反馈：{r.reviewFeedback||'无'}</div></div>)}
          {mine.length===0&&<div className="muted">暂无资源</div>}
        </div>}
      </div>}

      {token&&userInfo.role==='ADMIN'&&<div className="card"><h3>Admin 审核区</h3>
        {pending.map(r=><div key={r.id} className="resource-item">
          <div><b>#{r.id} {r.title||'(未命名)'}</b> by Contributor {r.contributorId}</div>
          <div>状态：{r.status}</div>
          <div className="muted">{r.description}</div>
          <textarea value={adminFeedback[r.id]||''} onChange={e=>setAdminFeedback(p=>({...p,[r.id]:e.target.value}))} placeholder="审核反馈（通过/拒绝都必填）"/>
          <div className="row"><button onClick={()=>review(r.id,true)}>审核通过</button><button className="danger" onClick={()=>review(r.id,false)}>审核拒绝</button></div>
        </div>)}
        {pending.length===0&&<div className="muted">暂无待审核资源</div>}
      </div>}

      {token&&(userInfo.role==='VIEWER'||userInfo.role==='CONTRIBUTOR')&&<div className="card"><h3>可见资源（仅 Approved）</h3>
        {approved.map(r=><div key={r.id} className="resource-item">
          <div><b>#{r.id} {r.title||'(未命名)'}</b></div>
          <div>状态：{r.status}</div>
          <div>{r.description}</div>
          <div className="muted">分类：{r.category||'-'}，地点：{r.place||'-'}</div>
          <div className="muted">标签：{r.tags||'-'}</div>
        </div>)}
        {approved.length===0&&<div className="muted">暂无已通过资源</div>}
      </div>}

      {message&&<div className="card"><b>提示：</b> {message}</div>}

      {validationErrors.length>0&&<div className="toast-container"><div className="toast-error">
        <div className="toast-title">提交审核失败，以下字段为必填项：</div>
        <ul className="toast-list">{validationErrors.map(e=><li key={e}>{e}</li>)}</ul>
      </div></div>}
    </div>
  )
}

