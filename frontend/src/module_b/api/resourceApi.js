import axiosInstance from '../../common/api/axiosInstance'

export const resourceApi = {
  getOptions: () => axiosInstance.get('/resources/options'),
  createDraft: () => axiosInstance.post('/resources'),
  saveDraft: (id, payload) => axiosInstance.post(`/resources/${id}/save-draft`, payload),
  uploadFile: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return axiosInstance.post(`/resources/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateExternalLink: (id, externalLink) =>
    axiosInstance.patch(`/resources/${id}/external-link`, { externalLink }),
  submit: (id) => axiosInstance.post(`/resources/${id}/submit`),
  getDrafts: () => axiosInstance.get('/resources/drafts'),
  getMine: () => axiosInstance.get('/resources/mine'),
  deleteDraft: (id) => axiosInstance.delete(`/resources/${id}/draft`),
  getApproved: () => axiosInstance.get('/resources/approved'),
  getPending: () => axiosInstance.get('/resources/pending'),
  review: (id, approved, feedback) =>
    axiosInstance.post(`/resources/${id}/review`, { approved, feedback })
}
