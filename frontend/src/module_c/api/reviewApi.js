import axiosInstance from '../../common/api/axiosInstance';

export const getResources = (params) =>
  axiosInstance.get('/reviews', { params });

export const getResourceDetail = (resourceId) =>
  axiosInstance.get(`/reviews/${resourceId}`);

export const approveResource = (resourceId, feedbackText) =>
  axiosInstance.post(`/reviews/${resourceId}/approve`, { feedbackText });

export const rejectResource = (resourceId, feedbackText) =>
  axiosInstance.post(`/reviews/${resourceId}/reject`, { feedbackText });

export const unpublishResource = (resourceId, reason) =>
  axiosInstance.post(`/reviews/${resourceId}/unpublish`, { feedbackText: reason });

export const republishResource = (resourceId, feedbackText) =>
  axiosInstance.post(`/reviews/${resourceId}/republish`, { feedbackText });

export const archiveResource = (resourceId, feedbackText) =>
  axiosInstance.post(`/reviews/${resourceId}/archive`, { feedbackText });

export const getReviewHistory = (resourceId) =>
  axiosInstance.get(`/reviews/${resourceId}/feedback`);

export const resubmitResource = (resourceId) =>
  axiosInstance.post(`/reviews/${resourceId}/resubmit`, {});
