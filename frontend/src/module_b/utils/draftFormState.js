/** Convert comma-joined external links into a list. */
export function externalLinkToArray(externalLink) {
  if (!externalLink || !String(externalLink).trim()) return []
  return String(externalLink)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/** Resolve province name from selected city. */
export function provinceForCity(chinaCities, city) {
  if (!city || !chinaCities) return ''
  for (const p of Object.keys(chinaCities)) {
    if ((chinaCities[p] || []).includes(city)) return p
  }
  return ''
}

/** Build DraftForm state from a draft row response. */
export function formStateFromDraftRow(r, options) {
  const links = externalLinkToArray(r.externalLink)
  const cid = r.categoryId != null ? r.categoryId : ''
  return {
    title: r.title || '',
    categoryId: cid,
    staleCategoryName: r.categoryStatus === 'INACTIVE' && cid !== '' ? (r.category || '') : null,
    place: r.place || '',
    province: provinceForCity(options?.chinaCities, r.place),
    description: r.description || '',
    tags: r.tags || '',
    copyrightDeclaration: r.copyrightDeclaration || '',
    externalLinks: links.length ? links : []
  }
}
