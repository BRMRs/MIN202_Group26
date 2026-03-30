import axios from 'axios';
import { MOCK_COMMENTS, MOCK_RESOURCES, MOCK_USERS } from './mockData';

/**
 * Comment API — Module D
 * D-PBI 5: Basic Commenting and Feedback
 *
 * 策略：
 * - 后端在线且有数据 → 使用真实数据。
 * - 后端在线但无数据（空数组）→ 用 Mock 评论兜底（_mockId 优先，URL id 其次）。
 * - 后端离线 → 完全用 Mock 评论。
 */

const apiClient = axios.create({ baseURL: '/api' });

/**
 * 根据 resourceId（URL id）和 mockId（Mock 数据中的 id）查找评论。
 * 两者可能不同（DB 自增 id vs Mock id）。
 */
function getMockComments(resourceId, mockId) {
  const urlId = parseInt(resourceId, 10);
  const mid = mockId ? parseInt(mockId, 10) : null;

  // 优先按 mockId 查（更准确），再按 URL id
  let list = mid !== null ? MOCK_COMMENTS.filter(c => c.resource_id === mid) : [];
  if (list.length === 0) {
    list = MOCK_COMMENTS.filter(c => c.resource_id === urlId);
  }

  return list.map(c => ({
    ...c,
    user: MOCK_USERS.find(u => u.id === c.user_id) ?? { id: c.user_id, username: 'User' + c.user_id },
    createdAt: c.created_at, // 统一字段名，兼容渲染层
  }));
}

/**
 * GET /api/comments/resource/{resourceId}
 */
export const getComments = async (resourceId, mockId) => {
  try {
    const res = await apiClient.get(`/comments/resource/${resourceId}`);
    const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

    // 后端返回空 → 用 Mock 评论兜底
    if (data.length === 0) {
      return { data: { code: 200, data: getMockComments(resourceId, mockId), message: 'mock fallback' } };
    }
    return { data: { code: 200, data, message: 'ok' } };
  } catch {
    // 后端不可达 → 完全用 Mock
    return { data: { code: 200, data: getMockComments(resourceId, mockId), message: 'mock' } };
  }
};

/**
 * POST /api/comments/resource/{resourceId}
 * PBI 4.5: 归档资源禁止评论。
 */
export const addComment = async (resourceId, content) => {
  try {
    const res = await apiClient.post(`/comments/resource/${resourceId}`, { content });
    const commentData = res.data?.data ?? res.data;

    // 后端可能只返回 { message: "..." } 而没有完整数据，构造显示对象
    const displayComment = (commentData && typeof commentData === 'object' && commentData.content)
      ? commentData
      : {
          id: Date.now(),
          content,
          createdAt: new Date().toISOString(),
          user: { id: 1, username: 'CurrentUser' },
        };

    return { data: { code: 200, data: displayComment, message: 'Comment added' } };
  } catch (err) {
    const status = err.response?.status;

    // 403/400 等业务错误直接传递给上层（如"归档资源禁止评论"）
    if (status && status !== 502 && status !== 503) {
      throw err;
    }

    // 网络/代理错误 → Mock 模拟
    const resource = MOCK_RESOURCES.find(r => r.id === parseInt(resourceId, 10));
    if (resource?.status === 'ARCHIVED') {
      const e = new Error('Cannot comment on archived resources');
      e.response = { status: 403, data: { message: 'Cannot comment on archived resources' } };
      throw e;
    }

    const newComment = {
      id: Date.now(),
      resource_id: parseInt(resourceId, 10),
      user: { id: 999, username: 'CurrentUser (Mock)' },
      content,
      createdAt: new Date().toISOString(),
    };
    return { data: { code: 200, data: newComment, message: 'mock' } };
  }
};

export const likeResource = () => Promise.resolve({ data: { code: 200, message: 'Liked' } });
export const unlikeResource = () => Promise.resolve({ data: { code: 200, message: 'Unliked' } });
