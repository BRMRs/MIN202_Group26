/**
 * Normalize Spring / ApiResponse / Map error payloads from axios.
 */
export function parseApiError(err) {
  const d = err?.response?.data
  if (!d) return err?.message || 'Operation failed. Please try again.'
  if (typeof d === 'string') return d
  if (d.error) return d.error
  if (d.message) return d.message
  return 'Operation failed. Please try again.'
}
