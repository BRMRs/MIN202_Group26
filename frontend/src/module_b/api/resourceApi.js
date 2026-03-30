import api from '../../common/api/client'

export const resourceApi = {
  // Get form options (categories, places, tags, copyright)
  getOptions: () => api.get('/resources/options'),

  // Create a new empty draft
  createDraft: () => api.post('/resources'),

  // Save draft metadata
  saveDraft: (id, payload) => api.post(`/resources/${id}/save-draft`, payload),

  // Upload file to draft
  uploadFile: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/resources/${id}/file`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Update external link
  updateExternalLink: (id, externalLink) =>
    api.patch(`/resources/${id}/external-link`, { externalLink }),

  // Submit for review
  submit: (id) => api.post(`/resources/${id}/submit`),

  // Get my drafts (DRAFT + REJECTED)
  getDrafts: () => api.get('/resources/drafts'),

  // Get all my resources
  getMine: () => api.get('/resources/mine'),

  // Delete draft
  deleteDraft: (id) => api.delete(`/resources/${id}/draft`),

  // Get approved resources
  getApproved: () => api.get('/resources/approved'),

  // Get pending resources (admin)
  getPending: () => api.get('/resources/pending'),

  // Review resource (admin)
  review: (id, approved, feedback) =>
    api.post(`/resources/${id}/review`, { approved, feedback })
}
