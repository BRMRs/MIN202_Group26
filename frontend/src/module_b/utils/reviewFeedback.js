/**
 * Pick the most recent rejection note from Module C review history.
 * @param {Array<{ decision?: string, feedbackText?: string, reviewedAt?: string }>} historyList
 */
export function pickLatestRejectionText(historyList) {
  return pickLatestDecisionText(historyList, 'REJECTED')
}

/**
 * Pick the most recent note by decision from Module C review history.
 * @param {Array<{ decision?: string, feedbackText?: string, reviewedAt?: string }>} historyList
 * @param {'REJECTED' | 'UNPUBLISHED' | 'ARCHIVED'} decision
 */
export function pickLatestDecisionText(historyList, decision) {
  if (!historyList?.length) return null
  const rows = historyList.filter(fb => fb && fb.decision === decision)
  if (!rows.length) return null
  rows.sort((a, b) => {
    const ta = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0
    const tb = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0
    return tb - ta
  })
  const t = rows[0]?.feedbackText
  return t != null && String(t).trim() ? String(t).trim() : null
}
