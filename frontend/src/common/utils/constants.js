// shared constants — keep in sync with backend enums and ValidationConstants.java

/** User roles — matches UserRole.java enum */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  CONTRIBUTOR: 'CONTRIBUTOR',
  VIEWER: 'VIEWER',
};

/** Resource statuses — matches ResourceStatus.java enum */
export const RESOURCE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
};

/** Contributor application statuses — matches ApplicationStatus.java enum */
export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/** API base URL — matches Vite proxy config */
export const API_BASE_URL = '/api';

/** Validation limits — matches ValidationConstants.java */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 50,
  MAX_COMMENT_LENGTH: 500,
  MAX_FEEDBACK_WORDS: 500,
  MAX_FILE_SIZE_MB: 10,
};
