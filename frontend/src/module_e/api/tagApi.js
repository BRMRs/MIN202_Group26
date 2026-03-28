const TAG_API_BASE = "http://localhost:8080/api/admin/tags";

async function parseJsonSafely(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function throwRequestError(response, fallbackMessage) {
  const errorData = await parseJsonSafely(response);
  throw new Error(errorData?.message || fallbackMessage);
}

export async function getTags() {
  const response = await fetch(TAG_API_BASE);

  if (!response.ok) {
    await throwRequestError(response, "Failed to load tags");
  }

  const result = await response.json();
  return result.data;
}

export async function createTag(data) {
  const response = await fetch(TAG_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to create tag");
  }

  const result = await response.json();
  return result.data;
}

export async function updateTag(id, data) {
  const response = await fetch(`${TAG_API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to update tag");
  }

  const result = await response.json();
  return result.data;
}

export async function deleteTag(id) {
  const response = await fetch(`${TAG_API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to delete tag");
  }

  const result = await response.json();
  return result.data;
}

export default {
  getTags,
  createTag,
  updateTag,
  deleteTag,
};
