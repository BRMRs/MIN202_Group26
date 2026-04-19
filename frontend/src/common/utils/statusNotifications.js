import { getReviewHistory } from '../../module_c/api/reviewApi';

export const STATUS_NOTIFICATION_DECISIONS = new Set([
  'APPROVED',
  'REJECTED',
  'UNPUBLISHED',
  'REPUBLISHED',
  'ARCHIVED',
]);

export const statusUpdateReadStoreKey = (user) =>
  `heritage-status-update-read-map:${user?.id ?? user?.username ?? 'anonymous'}`;

function asHistoryList(payload) {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  return Array.isArray(data) ? data : [];
}

function asMillis(datetime) {
  if (!datetime) return 0;
  const t = new Date(datetime).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildNotificationKey(resourceId, feedback, index) {
  if (feedback?.id != null) return `feedback:${feedback.id}`;
  const decision = String(feedback?.decision ?? 'UNKNOWN');
  const reviewedAt = String(feedback?.reviewedAt ?? '');
  return `feedback:${resourceId}:${decision}:${reviewedAt}:${index}`;
}

export async function fetchResourceReviewHistories(resources) {
  const list = Array.isArray(resources) ? resources : [];
  const rows = await Promise.all(
    list.map(async (resource) => {
      const resourceId = resource?.id;
      if (!resourceId) return [resourceId, []];
      try {
        const response = await getReviewHistory(resourceId);
        return [resourceId, asHistoryList(response)];
      } catch {
        return [resourceId, []];
      }
    })
  );

  return rows.reduce((acc, [resourceId, history]) => {
    if (resourceId) {
      acc[resourceId] = Array.isArray(history) ? history : [];
    }
    return acc;
  }, {});
}

export function buildStatusNotifications(resources, historyByResourceId) {
  const list = Array.isArray(resources) ? resources : [];
  const historyMap = historyByResourceId && typeof historyByResourceId === 'object'
    ? historyByResourceId
    : {};

  const notifications = [];

  list.forEach((resource) => {
    const resourceId = resource?.id;
    if (!resourceId) return;
    const history = Array.isArray(historyMap[resourceId]) ? historyMap[resourceId] : [];

    history.forEach((feedback, index) => {
      const decision = feedback?.decision;
      if (!STATUS_NOTIFICATION_DECISIONS.has(decision)) return;

      notifications.push({
        readKey: buildNotificationKey(resourceId, feedback, index),
        resourceId,
        resource,
        decision,
        previousStatus: feedback?.previousStatus ?? null,
        feedbackText: feedback?.feedbackText ?? '',
        reviewedAt: feedback?.reviewedAt ?? null,
        reviewerName: feedback?.reviewerName ?? '',
      });
    });
  });

  notifications.sort((a, b) => asMillis(b.reviewedAt) - asMillis(a.reviewedAt));
  return notifications;
}

