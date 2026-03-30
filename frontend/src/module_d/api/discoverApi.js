import { MOCK_RESOURCES } from './mockData';

/**
 * Discover API — Module D
 * Summary D-PBI 1 (Browse), D-PBI 2 (Search), D-PBI 3 (Filter), D-PBI 4 (Detail)
 */

// Mock implementation for PBI 4.4
export const getResourceDetail = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const resource = MOCK_RESOURCES.find(r => r.id === parseInt(id));
      if (resource) {
        resolve({ data: { code: 200, data: resource, message: "Success" } });
      } else {
        reject({ response: { status: 404, data: { message: "Resource not found" } } });
      }
    }, 500);
  });
};

// Placeholder for other PBIs (to be implemented by others or later)
export const browseResources = (page = 0, size = 12) => {
  console.warn("browseResources is a stub. Use real API in production.");
  return Promise.resolve({ data: { code: 200, data: { content: MOCK_RESOURCES }, message: "Mock data" } });
};
