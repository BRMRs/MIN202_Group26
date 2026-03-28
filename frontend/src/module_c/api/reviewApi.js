import axiosInstance from '../../common/api/axiosInstance';

// Hardcoded admin ID for testing until Module A JWT auth is integrated
const ADMIN_ID = 1;

/**
 * Review API — Module C, PBI 3.1 + PBI 3.2 + PBI 3.4
 */

export const getResources = (params) =>
  axiosInstance.get('/reviews', { params });

// PBI 3.2 — optional X-User-Id for access control on REJECTED resources
export const getResourceDetail = (resourceId) =>
  axiosInstance.get(`/reviews/${resourceId}`, {
    headers: { 'X-User-Id': ADMIN_ID },
  });

// PBI 3.2 — Approve: PENDING_REVIEW → APPROVED
export const approveResource = (resourceId, feedbackText) =>
  axiosInstance.post(
    `/reviews/${resourceId}/approve`,
    { feedbackText },
    { headers: { 'X-User-Id': ADMIN_ID } }
  );

// PBI 3.2 — Reject: PENDING_REVIEW → REJECTED (feedback mandatory)
export const rejectResource = (resourceId, feedbackText) =>
  axiosInstance.post(
    `/reviews/${resourceId}/reject`,
    { feedbackText },
    { headers: { 'X-User-Id': ADMIN_ID } }
  );

// PBI 3.2 — Unpublish: APPROVED → UNPUBLISHED
export const unpublishResource = (resourceId) =>
  axiosInstance.post(
    `/reviews/${resourceId}/unpublish`,
    {},
    { headers: { 'X-User-Id': ADMIN_ID } }
  );

// PBI 3.2 — Republish: UNPUBLISHED → APPROVED
export const republishResource = (resourceId) =>
  axiosInstance.post(
    `/reviews/${resourceId}/republish`,
    {},
    { headers: { 'X-User-Id': ADMIN_ID } }
  );

// PBI 3.1 — Archive: APPROVED/UNPUBLISHED → ARCHIVED
export const archiveResource = (resourceId, feedbackText) =>
  axiosInstance.post(
    `/reviews/${resourceId}/archive`,
    { feedbackText },
    { headers: { 'X-User-Id': ADMIN_ID } }
  );

export const getReviewHistory = (resourceId) =>
  axiosInstance.get(`/reviews/${resourceId}/feedback`);

// PBI 3.4 — Resubmit: REJECTED → PENDING_REVIEW (contributor action)
// X-User-Id must be the contributor's own ID
export const resubmitResource = (resourceId, contributorId) =>
  axiosInstance.post(
    `/reviews/${resourceId}/resubmit`,
    {},
    { headers: { 'X-User-Id': contributorId } }
  );
