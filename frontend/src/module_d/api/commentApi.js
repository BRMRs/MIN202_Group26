import axiosInstance from '../../common/api/axiosInstance';

/**
 * Comment & like API — Module D
 * PBI 4.5: comments, likes, validation and archived rules on backend; Bearer via axios default
 */
export const getComments = (resourceId) =>
  axiosInstance.get(`/comments/resource/${resourceId}`).then((res) => res.data);

export const addComment = (resourceId, content) =>
  axiosInstance.post(`/comments/resource/${resourceId}`, { content });

export const likeResource = (resourceId) =>
  axiosInstance.post(`/comments/${resourceId}/like`);

export const unlikeResource = (resourceId) =>
  axiosInstance.delete(`/comments/${resourceId}/unlike`);

export const getLikedState = (resourceId) =>
  axiosInstance.get(`/comments/${resourceId}/liked`).then((res) => res.data);
