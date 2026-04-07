import axios from 'axios';

/**
 * Discover API — Module D
 * Summary D-PBI 1 (Browse), D-PBI 2 (Search), D-PBI 3 (Filter), D-PBI 4 (Detail)
 */

const apiClient = axios.create({
  baseURL: '/api',
});

/** Shown when browse/search request fails (network or server error), not when the list is simply empty. */
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

export const browseResources = ({ page = 0, size = 10, sortBy = 'createdAt', direction = 'DESC' } = {}) =>
  apiClient.get('/discover/resources', { params: { page, size, sortBy, direction } });

export const searchAndFilterResources = ({
  keyword,
  categoryId,
  tagIds = [],
  page = 0,
  size = 10,
  sortBy = 'createdAt',
  direction = 'DESC',
} = {}) =>
  apiClient.get('/discover/resources', {
    params: cleanParams({ keyword, categoryId, tagIds, page, size, sortBy, direction }),
  });

export const listCategories = () => apiClient.get('/discover/categories');
export const listTags = () => apiClient.get('/discover/tags');
export const getResourceDetail = (id) => apiClient.get(`/discover/resources/${id}`);
