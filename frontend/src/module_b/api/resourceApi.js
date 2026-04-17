import axiosInstance from '../../common/api/axiosInstance'

export const resourceApi = {
  getOptions: () => axiosInstance.get('/resources/options'),
  createDraft: () => axiosInstance.post('/resources'),
  saveDraft: (id, payload) => axiosInstance.post(`/resources/${id}/save-draft`, payload),
  uploadFiles: (id, files) => {
    const form = new FormData()
    files.forEach(file => form.append('files', file))
    return axiosInstance.post(`/resources/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateExternalLinks: (id, externalLinks) =>
    axiosInstance.patch(`/resources/${id}/external-link`, { externalLinks }),
  submit: (id) => axiosInstance.post(`/resources/${id}/submit`),
  getDrafts: () => axiosInstance.get('/resources/drafts'),
  getContributorRejectedCount: () => axiosInstance.get('/resources/contributor/rejected-count'),
  getMine: () => axiosInstance.get('/resources/mine'),
  deleteDraft: (id) => axiosInstance.delete(`/resources/${id}/draft`),
  getApproved: () => axiosInstance.get('/resources/approved'),
  getPending: () => axiosInstance.get('/resources/pending'),
  review: (id, approved, feedback) =>
    axiosInstance.post(`/resources/${id}/review`, { approved, feedback })
}
