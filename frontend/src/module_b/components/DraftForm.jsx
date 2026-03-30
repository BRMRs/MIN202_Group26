import styles from './DraftForm.module.css'

export default function DraftForm({ form, setForm, options, file, setFile }) {
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const titleMax = options.titleMaxLength || 30
  const descMax = options.descriptionMaxLength || 2000

  return (
    <div className={styles.form}>
      {/* Title */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label>标题 <span className={styles.req}>*</span></label>
          <span className={form.title.length >= titleMax ? styles.countWarn : styles.count}>
            {form.title.length}/{titleMax}
          </span>
        </div>
        <input
          value={form.title}
          onChange={e => set('title', e.target.value.slice(0, titleMax))}
          placeholder="请输入标题（30字内）"
          className={styles.input}
        />
      </div>

      {/* Category + Place */}
      <div className={styles.row2}>
        <div className={styles.field}>
          <label>分类 <span className={styles.req}>*</span></label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={styles.input}>
            <option value="">选择分类</option>
            {options.categories?.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>地点 <span className={styles.req}>*</span></label>
          <select value={form.place} onChange={e => set('place', e.target.value)} className={styles.input}>
            <option value="">选择地点</option>
            {options.places?.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label>描述 <span className={styles.req}>*</span></label>
          <span className={form.description.length >= descMax ? styles.countWarn : styles.count}>
            {form.description.length}/{descMax}
          </span>
        </div>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value.slice(0, descMax))}
          placeholder="请输入描述（2000字内）"
          className={styles.textarea}
        />
      </div>

      {/* Tags */}
      <div className={styles.field}>
        <label>标签 <span className={styles.req}>*</span> <span className={styles.muted}>（推荐：{options.recommendedTags?.join('、')}）</span></label>
        <input
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
          placeholder="以 # 开头，空格分隔，最多5个"
          className={styles.input}
        />
      </div>

      {/* Copyright */}
      <div className={styles.field}>
        <label>版权声明 <span className={styles.req}>*</span></label>
        <select value={form.copyrightDeclaration} onChange={e => set('copyrightDeclaration', e.target.value)} className={styles.input}>
          <option value="">选择版权声明</option>
          {options.copyrightOptions?.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* File upload */}
      <div className={styles.field}>
        <label>上传文件 <span className={styles.muted}>（.docx / .pdf / .txt，与外链二选一）</span></label>
        <input type="file" accept=".docx,.pdf,.txt" onChange={e => setFile(e.target.files[0])} className={styles.fileInput} />
        {file && <span className={styles.muted}>已选择：{file.name}</span>}
      </div>

      {/* External link */}
      <div className={styles.field}>
        <label>外部链接 <span className={styles.muted}>（与文件上传二选一）</span></label>
        <input
          value={form.externalLink}
          onChange={e => set('externalLink', e.target.value)}
          placeholder="https://..."
          className={styles.input}
        />
      </div>
    </div>
  )
}
