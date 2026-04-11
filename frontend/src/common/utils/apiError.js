/**
 * Normalize Spring / ApiResponse / Map error payloads from axios.
 */
export function parseApiError(err) {
  const d = err?.response?.data
  if (!d) return err?.message || '操作失败，请重试'
  if (typeof d === 'string') return d
  if (d.error) return d.error
  if (d.message) return d.message
  return '操作失败，请重试'
}
