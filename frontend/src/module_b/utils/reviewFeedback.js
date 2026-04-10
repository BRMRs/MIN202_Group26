/**
 * Pick the most recent rejection note from Module C review history.
 * @param {Array<{ decision?: string, feedbackText?: string, reviewedAt?: string }>} historyList
 */
export function pickLatestRejectionText(historyList) {
  if (!historyList?.length) return null
  const rej = historyList.filter(fb => fb && fb.decision === 'REJECTED')
  if (!rej.length) return null
  rej.sort((a, b) => {
    const ta = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0
    const tb = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0
    return tb - ta
  })
  const t = rej[0]?.feedbackText
  return t != null && String(t).trim() ? String(t).trim() : null
}
