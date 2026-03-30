import { MOCK_COMMENTS, MOCK_RESOURCES } from './mockData';

/**
 * Comment API — Module D
 * Summary D-PBI 5: Basic Commenting and Feedback
 */

// Mock implementation for PBI 4.5
export const getComments = (resourceId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const comments = MOCK_COMMENTS.filter(c => c.resource_id === parseInt(resourceId));
      resolve({ data: { code: 200, data: comments, message: "Success" } });
    }, 500);
  });
};

export const addComment = (resourceId, content) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const resource = MOCK_RESOURCES.find(r => r.id === parseInt(resourceId));
      
      // Backend check simulation: prevent commenting if archived
      if (resource && resource.status === 'ARCHIVED') {
        reject({ response: { status: 403, data: { message: "Cannot comment on archived resources" } } });
        return;
      }

      const newComment = {
        id: Math.floor(Math.random() * 1000) + 100,
        resource_id: parseInt(resourceId),
        user: { id: 999, username: "CurrentUser (Mock)", avatar_url: null },
        content: content,
        created_at: new Date().toISOString()
      };
      // In a real mock we might push to MOCK_COMMENTS, but for UI testing this is enough
      resolve({ data: { code: 200, data: newComment, message: "Comment added" } });
    }, 500);
  });
};

export const likeResource = (resourceId) => {
  return Promise.resolve({ data: { code: 200, message: "Liked" } });
};

export const unlikeResource = (resourceId) => {
  return Promise.resolve({ data: { code: 200, message: "Unliked" } });
};
