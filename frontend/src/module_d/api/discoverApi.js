import axios from 'axios';
import { MOCK_RESOURCES, MOCK_USERS, MOCK_CATEGORIES, MOCK_TAGS } from './mockData';

/**
 * Discover API — Module D
 * D-PBI 1 (Browse), D-PBI 2 (Search), D-PBI 3 (Filter), D-PBI 4 (Detail)
 *
 * 核心策略：
 * - 后端在线 + 标题匹配到 Mock → 强制用 Mock 的图片/日期/统计数据覆盖后端数据。
 * - 后端在线 + 资源不存在（404/异常）→ 用 Mock 数据兜底（不抛错）。
 * - 后端离线（ECONNREFUSED）→ 完全用 Mock 数据。
 */

const apiClient = axios.create({ baseURL: '/api' });

export const DISCOVER_LOAD_ERROR_MESSAGE = "We couldn't load this content.";

const cleanParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

// ─── normalize helpers ────────────────────────────────────────────────────────

function normalizeMockResource(r) {
  const category = MOCK_CATEGORIES.find(c => c.id === r.category_id);
  const tags = (r.tag_ids || []).map(tid => MOCK_TAGS.find(t => t.id === tid)).filter(Boolean);
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    place: r.place,
    fileUrl: r.media?.[0]?.file_url ?? null,
    externalLink: r.external_link ?? null,
    categoryName: category?.name ?? null,
    tags,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at ?? null,
    status: r.status,
  };
}

function normalizeMockDetail(r) {
  const category = MOCK_CATEGORIES.find(c => c.id === r.category_id);
  const contributor = MOCK_USERS.find(u => u.id === r.contributor_id) ?? null;
  const tags = (r.tag_ids || []).map(tid => MOCK_TAGS.find(t => t.id === tid)).filter(Boolean);
  return {
    id: r.id,
    _mockId: r.id,
    title: r.title,
    description: r.description,
    place: r.place,
    fileUrl: r.media?.[0]?.file_url ?? null,
    externalLink: r.external_link ?? null,
    copyrightDeclaration: r.copyright_declaration ?? null,
    categoryName: category?.name ?? null,
    categoryId: r.category_id ?? null,
    contributor,
    status: r.status,
    tags,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    createdAt: r.created_at ?? null,
    updatedAt: r.updated_at ?? null,
    media: (r.media ?? []).map(m => ({
      id: m.id,
      mediaType: m.media_type,
      fileUrl: m.file_url,
      fileName: m.file_name,
    })),
  };
}

/**
 * 找 Mock 资源：先按 URL id，再按标题
 */
function findMock(urlId, title) {
  return MOCK_RESOURCES.find(r => r.id === urlId)
    || (title ? MOCK_RESOURCES.find(r => r.title.trim() === title.trim()) : null);
}

/**
 * 把后端列表中的每一项用匹配的 Mock 数据强制覆盖关键字段
 */
function injectMockDataToSummary(content) {
  if (!content || !Array.isArray(content)) return content;
  return content.map(item => {
    const mock = findMock(item.id, item.title);
    if (!mock) return item;
    const n = normalizeMockResource(mock);
    return { ...item, ...n, id: item.id }; // 保留后端真实 id
  });
}

function mockPageResponse(resources, page, size) {
  const start = page * size;
  const content = resources.slice(start, start + size).map(normalizeMockResource);
  return {
    data: {
      content,
      page,
      size,
      totalElements: resources.length,
      totalPages: Math.max(1, Math.ceil(resources.length / size)),
    },
  };
}

// ─── public API ──────────────────────────────────────────────────────────────

export const browseResources = async ({ page = 0, size = 10, sortBy = 'createdAt', direction = 'DESC' } = {}) => {
  try {
    const res = await apiClient.get('/discover/resources', { params: { page, size, sortBy, direction } });
    if (res.data?.content) {
      res.data.content = injectMockDataToSummary(res.data.content);
    }
    return res;
  } catch {
    let resources = MOCK_RESOURCES.filter(r => r.status === 'APPROVED');
    if (sortBy === 'interaction') {
      resources.sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
    } else {
      resources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (direction === 'ASC') resources.reverse();
    return mockPageResponse(resources, page, size);
  }
};

export const searchAndFilterResources = async ({
  keyword, categoryId, tagIds = [], page = 0, size = 10, sortBy = 'createdAt', direction = 'DESC',
} = {}) => {
  try {
    const res = await apiClient.get('/discover/resources', {
      params: cleanParams({ keyword, categoryId, tagIds, page, size, sortBy, direction }),
    });
    if (res.data?.content) {
      res.data.content = injectMockDataToSummary(res.data.content);
    }
    return res;
  } catch {
    let resources = MOCK_RESOURCES.filter(r => r.status === 'APPROVED');
    if (keyword) {
      const kw = keyword.toLowerCase();
      resources = resources.filter(r =>
        r.title?.toLowerCase().includes(kw) || r.description?.toLowerCase().includes(kw),
      );
    }
    if (categoryId) resources = resources.filter(r => r.category_id === categoryId);
    return mockPageResponse(resources, page, size);
  }
};

export const listCategories = async () => {
  try {
    return await apiClient.get('/discover/categories');
  } catch {
    return { data: MOCK_CATEGORIES };
  }
};

export const listTags = async () => {
  try {
    return await apiClient.get('/discover/tags');
  } catch {
    return { data: MOCK_TAGS };
  }
};

/**
 * 获取资源详情。
 * - 后端成功 → 用 Mock 数据覆盖图片/日期/统计，保留真实 id。
 * - 后端失败（任何原因）→ 按 URL id 在 Mock 中查找，找不到才抛 404。
 */
export const getResourceDetail = async (id) => {
  const urlId = parseInt(id, 10);

  try {
    const res = await apiClient.get(`/discover/resources/${id}`);
    const data = res.data;

    // 后端成功：找对应 Mock，覆盖关键字段
    const mock = findMock(urlId, data?.title);
    if (mock) {
      const m = normalizeMockDetail(mock);
      return {
        data: {
          ...m,
          ...data,          // 后端的 title/desc/place 等优先
          id: urlId,        // 保留真实 URL id（供评论接口使用）
          _mockId: mock.id, // 供评论回退使用
          media: m.media,
          fileUrl: m.fileUrl,
          likeCount: m.likeCount,
          commentCount: m.commentCount,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          contributor: m.contributor,
          tags: m.tags.length > 0 ? m.tags : (data.tags ?? []),
          status: data.status ?? m.status,
        },
      };
    }

    // 后端成功但无 Mock 匹配 → 直接使用后端数据
    return { data: { ...data, id: urlId } };

  } catch {
    // 后端失败（404、503、离线等）→ 用 Mock 兜底
    const mock = MOCK_RESOURCES.find(r => r.id === urlId);
    if (!mock) {
      const err = new Error('Resource not found');
      err.response = { status: 404, data: { message: 'Resource not found or not approved.' } };
      throw err;
    }
    return { data: { ...normalizeMockDetail(mock), id: urlId, _mockId: mock.id } };
  }
};
