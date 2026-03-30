const RESOURCE_ADMIN_API_BASE = "http://localhost:8080/api/admin/resources";

async function parseJsonSafely(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function throwRequestError(response, fallbackMessage) {
  const errorData = await parseJsonSafely(response);
  throw new Error(errorData?.message || fallbackMessage);
}

export async function listAdminResources() {
  const response = await fetch(RESOURCE_ADMIN_API_BASE);
  if (!response.ok) {
    await throwRequestError(response, "Failed to load resources");
  }
  const result = await response.json();
  return result.data;
}

export async function getAdminResourceDetail(id) {
  const response = await fetch(`${RESOURCE_ADMIN_API_BASE}/${id}`);
  if (!response.ok) {
    await throwRequestError(response, "Failed to load resource detail");
  }
  const result = await response.json();
  return result.data;
}

export async function unpublishAdminResource(id) {
  const response = await fetch(`${RESOURCE_ADMIN_API_BASE}/${id}/unpublish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    await throwRequestError(response, "Failed to unpublish resource");
  }
  const result = await response.json();
  return result.data;
}

export async function archiveAdminResource(id, reason) {
  const response = await fetch(`${RESOURCE_ADMIN_API_BASE}/${id}/archive`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    await throwRequestError(response, "Failed to archive resource");
  }
  const result = await response.json();
  return result.data;
}

export async function republishAdminResource(id, categoryId) {
  const response = await fetch(`${RESOURCE_ADMIN_API_BASE}/${id}/republish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ categoryId }),
  });
  if (!response.ok) {
    await throwRequestError(response, "Failed to republish resource");
  }
  const result = await response.json();
  return result.data;
}

export async function updateAdminResourceCategory(id, categoryId) {
  const response = await fetch(`${RESOURCE_ADMIN_API_BASE}/${id}/category`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ categoryId }),
  });
  if (!response.ok) {
    await throwRequestError(response, "Failed to update resource category");
  }
  const result = await response.json();
  return result.data;
}

export default {
  listAdminResources,
  getAdminResourceDetail,
  unpublishAdminResource,
  archiveAdminResource,
  republishAdminResource,
  updateAdminResourceCategory,
};
