import styles from './DraftForm.module.css'

export default function DraftForm({ form, setForm, options, file, setFile }) {
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const titleMax = options.titleMaxLength || 30
  const descMax = options.descriptionMaxLength || 2000

  return (
    <div className={styles.form}>
      {/* ── Basic Information ── */}
      <p className={styles.sectionTitle}>Basic Information</p>
      <div className={styles.fieldsGroup}>
        {/* Title */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>
              Title <span className={styles.req}>*</span>
            </label>
            <span className={form.title.length >= titleMax ? styles.countWarn : styles.count}>
              {form.title.length}/{titleMax}
            </span>
          </div>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value.slice(0, titleMax))}
            placeholder="Enter a descriptive title"
            className={styles.input}
          />
        </div>

        {/* Category + Place */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>
              Category <span className={styles.req}>*</span>
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className={styles.input}
            >
              <option value="">Select a category</option>
              {options.categories?.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Place <span className={styles.req}>*</span>
            </label>
            <select
              value={form.place}
              onChange={e => set('place', e.target.value)}
              className={styles.input}
            >
              <option value="">Select a place</option>
              {options.places?.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <hr className={styles.sectionDivider} />

      {/* ── Content & Metadata ── */}
      <p className={styles.sectionTitle}>Content & Metadata</p>
      <div className={styles.fieldsGroup}>
        {/* Description */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>
              Description <span className={styles.req}>*</span>
            </label>
            <span className={form.description.length >= descMax ? styles.countWarn : styles.count}>
              {form.description.length}/{descMax}
            </span>
          </div>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value.slice(0, descMax))}
            placeholder="Describe the cultural heritage resource in detail…"
            className={styles.textarea}
          />
        </div>

        {/* Tags */}
        <div className={styles.field}>
          <label className={styles.label}>
            Tags <span className={styles.req}>*</span>
            {options.recommendedTags?.length > 0 && (
              <span className={styles.muted}> — suggested: {options.recommendedTags.join(', ')}</span>
            )}
          </label>
          <input
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="Start with # and separate with spaces, e.g. #heritage #culture"
            className={styles.input}
          />
        </div>

        {/* Copyright */}
        <div className={styles.field}>
          <label className={styles.label}>
            Copyright Declaration <span className={styles.req}>*</span>
          </label>
          <select
            value={form.copyrightDeclaration}
            onChange={e => set('copyrightDeclaration', e.target.value)}
            className={styles.input}
          >
            <option value="">Select a copyright declaration</option>
            {options.copyrightOptions?.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <hr className={styles.sectionDivider} />

      {/* ── Upload / External Link ── */}
      <p className={styles.sectionTitle}>File or External Link</p>
      <div className={styles.fieldsGroup}>
        {/* File upload */}
        <div className={styles.field}>
          <label className={styles.label}>
            Upload File
            <span className={styles.muted}> — .docx · .pdf · .txt (choose one or the other)</span>
          </label>
          <label className={`${styles.uploadArea}${file ? ` ${styles.uploadAreaHasFile}` : ''}`}>
            {file ? (
              <>
                <span className={styles.uploadIcon}>📄</span>
                <span className={styles.uploadFileName}>{file.name}</span>
                <span className={styles.uploadHint}>Click to replace</span>
              </>
            ) : (
              <>
                <span className={styles.uploadIcon}>📁</span>
                <span className={styles.uploadPrompt}>Click to choose a file</span>
                <span className={styles.uploadHint}>.docx · .pdf · .txt</span>
              </>
            )}
            <input
              type="file"
              accept=".docx,.pdf,.txt"
              onChange={e => setFile(e.target.files[0] || null)}
              className={styles.fileInputHidden}
            />
          </label>
        </div>

        {/* External link */}
        <div className={styles.field}>
          <label className={styles.label}>
            External Link
            <span className={styles.muted}> — or provide a URL instead of uploading</span>
          </label>
          <input
            value={form.externalLink}
            onChange={e => set('externalLink', e.target.value)}
            placeholder="https://…"
            className={styles.input}
          />
        </div>
      </div>
    </div>
  )
}
