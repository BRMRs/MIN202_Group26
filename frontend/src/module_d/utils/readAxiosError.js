/** Backend may return { message }, ApiResponse, or plain text. */
export function readAxiosError(err, fallback = 'Something went wrong.') {
  const status = err?.response?.status;
  const d = err?.response?.data;
  if (d == null) return err?.message || fallback;
  if (typeof d === 'string') return d;
  if (typeof d.message === 'string' && d.message) return d.message;
  return fallback;
}

export function isNotFoundError(err) {
  return err?.response?.status === 404;
}
