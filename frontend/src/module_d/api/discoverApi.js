import axios from 'axios';

/**
 * Discover API — Module D
 * PBI 4.1: Browse, PBI 4.2: Search, PBI 4.3: Filter
 * PBI 4.4: Resource detail (GET /discover/resources/{id}), media, list load errors
 */
const apiClient = axios.create({
  baseURL: '/api',
});

// List/browse failure: network or server (not an empty list)
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
  place,
  page = 0,
  size = 10,
  sortBy = 'createdAt',
  direction = 'DESC',
} = {}) =>
  apiClient.get('/discover/resources', {
    params: cleanParams({ keyword, categoryId, tagIds, place, page, size, sortBy, direction }),
  });

export const listCategories = () => apiClient.get('/discover/categories');
export const listTags = () => apiClient.get('/discover/tags');
// Places (approved resources) for filter dropdown
export const listPlaces = () => apiClient.get('/discover/places');
export const getResourceDetail = (id) => apiClient.get(`/discover/resources/${id}`);
