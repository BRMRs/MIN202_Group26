import { useMemo, useRef, useState } from 'react'
import styles from './DraftForm.module.css'

const linkPattern = /^https?:\/\//i

const CATEGORY_TRANSLATIONS = {
  '传统技艺': 'Traditional Craftsmanship',
  '民俗活动': 'Folk Customs',
  '民间文学与口述史': 'Folk Literature & Oral History',
  '传统表演艺术': 'Traditional Performing Arts',
  '历史建筑与聚落': 'Historic Architecture & Settlements',
  '传统美术': 'Traditional Fine Arts',
  '传统体育与游艺': 'Traditional Sports & Games',
  '非遗美食与饮食习俗': 'Intangible Heritage Cuisine & Foodways'
}

const translateCategoryName = name => CATEGORY_TRANSLATIONS[name] || name

export default function DraftForm({ form, setForm, options, files, setFiles, serverMedia, fileInputResetKey = 0, externalLinkError, tagSubmitError }) {
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const titleMax = options.titleMaxLength || 30
  const descMax = options.descriptionMaxLength || 2000
  const maxFiles = options.maxFiles || 5
  const maxFileSizeBytes = options.maxFileSizeBytes || 50 * 1024 * 1024
  const allowedExt = options.allowedFileExtensions || []

  const previews = useMemo(() => {
    return (files || []).map(file => {
      const url = URL.createObjectURL(file)
      return { file, url }
    })
  }, [files])

  const addFiles = incoming => {
    if (!incoming || incoming.length === 0) return
    const current = files || []
    const next = [...current]
    for (const file of Array.from(incoming)) {
      if (next.length >= maxFiles) break
      if (file.size > maxFileSizeBytes) {
        showFileError('File exceeds 50MB. Upload failed.')
        continue
      }
      next.push(file)
    }
    setFiles(next)
  }

  const removeFile = index => {
    setFiles((files || []).filter((_, i) => i !== index))
  }

  const openPreview = url => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const addLinkRow = () => {
    set('externalLinks', [...(form.externalLinks || []), ''])
  }

  const updateLink = (index, value) => {
    const next = [...(form.externalLinks || [])]
    next[index] = value
    set('externalLinks', next)
  }

  const removeLink = index => {
    const next = [...(form.externalLinks || [])]
    next.splice(index, 1)
    set('externalLinks', next)
  }

  const fileHint = allowedExt.length > 0 ? allowedExt.join(' / ') : '.docx / .pdf / .txt / .png / .jpg / .jpeg / .mov / .mp3'
  const [tagError, setTagError] = useState('')
  const [fileError, setFileError] = useState('')
  const fileErrorTimerRef = useRef(null)

  const showFileError = message => {
    setFileError(message)
    if (fileErrorTimerRef.current) clearTimeout(fileErrorTimerRef.current)
    fileErrorTimerRef.current = setTimeout(() => setFileError(''), 2000)
  }

  const addTagSlot = () => {
    const current = form.tags || ''
    const parts = current.split(' ').filter(Boolean)
    if (parts.length >= 5) {
      setTagError('Up to 5 tags only.')
      return
    }
    const next = current.trim()
      ? `${current.trim()} #`
      : '#'
    set('tags', next)
    setTagError('')
  }

  const addRecommendedTag = (tag) => {
    const current = (form.tags || '').trim()
    const parts = current.split(/\s+/).filter(Boolean)
    const normalized = tag.startsWith('#') ? tag : `#${tag}`
    if (parts.length >= 5) {
      setTagError('Up to 5 tags only.')
      return
    }
    if (parts.includes(normalized)) return
    const next = current ? `${current} ${normalized}` : normalized
    set('tags', next)
    setTagError('')
  }

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

        {/* Category */}
        <div className={styles.field}>
          <label className={styles.label}>
            Category <span className={styles.req}>*</span>
          </label>
          <select
            value={form.categoryId === '' || form.categoryId == null ? '' : String(form.categoryId)}
            onChange={e => {
              const v = e.target.value
              setForm(prev => ({
                ...prev,
                categoryId: v === '' ? '' : Number(v),
                staleCategoryName: null
              }))
            }}
            className={styles.input}
          >
            <option value="">Select category</option>
            {form.staleCategoryName ? (
              <option value={String(form.categoryId)} disabled>
                {translateCategoryName(form.staleCategoryName)} (inactive, choose another active category)
              </option>
            ) : null}
            {(options.categories || []).map(c => (
              <option key={c.id} value={String(c.id)}>{translateCategoryName(c.name)}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className={styles.field}>
          <label className={styles.label}>
            Location <span className={styles.req}>*</span>
          </label>
          {options.chinaCities && Object.keys(options.chinaCities).length > 0 ? (
            <div className={styles.row2}>
              <select
                value={form.province || ''}
                onChange={e => {
                  set('province', e.target.value)
                  set('place', '')
                }}
                className={styles.input}
              >
                <option value="">Select province</option>
                {Object.keys(options.chinaCities).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={form.place}
                onChange={e => set('place', e.target.value)}
                className={styles.input}
                disabled={!form.province}
              >
                <option value="">Select city</option>
                {(options.chinaCities[form.province] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <select value={form.place} onChange={e => set('place', e.target.value)} className={styles.input}>
              <option value="">Select location</option>
              {options.places?.map(p => <option key={p}>{p}</option>)}
            </select>
          )}
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
          <div className={styles.labelRow}>
            <label className={styles.label}>
              Tags <span className={styles.req}>*</span>
              {options.recommendedTags?.length > 0 && (
                <span className={styles.muted}> — suggested: {options.recommendedTags.join(', ')}</span>
              )}
            </label>
            <button type="button" className={styles.tagAdd} onClick={addTagSlot}>+ Tag</button>
          </div>
          <input
            value={form.tags}
            onChange={e => {
              set('tags', e.target.value)
              if (tagError) setTagError('')
            }}
            placeholder="#tag1 #tag2 (max 5)"
            className={styles.input}
          />
          <div className={styles.tagRecommendList}>
            {options.recommendedTags?.map(tag => (
              <button
                key={tag}
                type="button"
                className={styles.tagRecommend}
                onClick={() => addRecommendedTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
          {tagError && <div className={styles.tagError}>{tagError}</div>}
          {tagSubmitError && <div className={styles.tagSubmitError}>{tagSubmitError}</div>}
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
            Files
            <span className={styles.muted}> — {fileHint}, up to {maxFiles} files, ≤50MB each</span>
          </label>
          {fileError && <div className={styles.fileError}>{fileError}</div>}
          {serverMedia?.length > 0 && (
            <div className={styles.fileList}>
              <div className={styles.muted}>Files already uploaded</div>
              {serverMedia.map((m, index) => (
                <div key={`srv-${m.fileUrl}-${index}`} className={styles.fileItem}>
                  <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.fileName}>
                    {m.fileName || m.fileUrl}
                  </a>
                  <span className={styles.fileMeta}>
                    {m.fileSize != null ? `${(m.fileSize / 1024 / 1024).toFixed(1)} MB` : '—'}
                  </span>
                  <span className={styles.fileMeta}>Uploaded</span>
                </div>
              ))}
            </div>
          )}
          <input
            key={`file-input-${fileInputResetKey}`}
            type="file"
            accept={allowedExt.join(',')}
            multiple
            onChange={e => addFiles(e.target.files)}
            className={styles.fileInput}
          />
          {files?.length > 0 && (
            <div className={styles.fileList}>
              {previews.map(({ file, url }, index) => (
                <div key={`${file.name}-${index}`} className={styles.fileItem}>
                  <button type="button" className={styles.fileName} onClick={() => openPreview(url)}>
                    {file.name}
                  </button>
                  <span className={styles.fileMeta}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" className={styles.fileRemove} onClick={() => removeFile(index)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* External links */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>
              External Links
              <span className={styles.muted}> — or provide a URL instead of uploading</span>
            </label>
            <button type="button" className={styles.linkAdd} onClick={addLinkRow}>+ Add link</button>
          </div>
          {(form.externalLinks || []).length === 0 && (
            <div className={styles.muted}>No links added yet</div>
          )}
          {(form.externalLinks || []).map((value, index) => (
            <div key={`link-${index}`} className={styles.linkRow}>
              <input
                value={value}
                onChange={e => updateLink(index, e.target.value)}
                placeholder="https://..."
                className={styles.input}
              />
              {!value || linkPattern.test(value) ? null : (
                <span className={styles.linkWarn}>Link must start with http/https</span>
              )}
              <button type="button" className={styles.linkRemove} onClick={() => removeLink(index)}>Remove</button>
            </div>
          ))}
          {externalLinkError && <div className={styles.linkError}>{externalLinkError}</div>}
        </div>
      </div>
    </div>
  )
}
