import api from '../../common/api/client'

export const resourceApi = {
  getOptions: () => api.get('/resources/options'),
  createDraft: () => api.post('/resources'),
  saveDraft: (id, payload) => api.post(`/resources/${id}/save-draft`, payload),
  uploadFile: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/resources/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateExternalLink: (id, externalLink) =>
    api.patch(`/resources/${id}/external-link`, { externalLink }),
  submit: (id) => api.post(`/resources/${id}/submit`),
  getDrafts: () => api.get('/resources/drafts'),
  getMine: () => api.get('/resources/mine'),
  deleteDraft: (id) => api.delete(`/resources/${id}/draft`),
  getApproved: () => api.get('/resources/approved'),
  getPending: () => api.get('/resources/pending'),
  review: (id, approved, feedback) =>
    api.post(`/resources/${id}/review`, { approved, feedback })
}