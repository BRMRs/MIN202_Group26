import axiosInstance from '../../common/api/axiosInstance';

/**
 * Comment & like API — Module D (real backend, no mock).
 * Base URL: /api (see axiosInstance + Vite proxy)
 */

/** GET /api/comments/resource/{resourceId} → CommentResponseDto[] */
export const getComments = (resourceId) =>
  axiosInstance.get(`/comments/resource/${resourceId}`).then((res) => res.data);

/**
 * POST /api/comments/resource/{resourceId}
 * Body: { content } — requires Bearer token (login).
 */
export const addComment = (resourceId, content) =>
  axiosInstance.post(`/comments/resource/${resourceId}`, { content });

/** POST /api/comments/{resourceId}/like */
export const likeResource = (resourceId) =>
  axiosInstance.post(`/comments/${resourceId}/like`);

/** DELETE /api/comments/{resourceId}/unlike */
export const unlikeResource = (resourceId) =>
  axiosInstance.delete(`/comments/${resourceId}/unlike`);

/** GET /api/comments/{resourceId}/liked → { liked, authenticated } */
export const getLikedState = (resourceId) =>
  axiosInstance.get(`/comments/${resourceId}/liked`).then((res) => res.data);
