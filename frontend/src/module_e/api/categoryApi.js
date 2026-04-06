const CATEGORY_API_BASE = "http://localhost:8080/api/admin/categories";

async function parseJsonSafely(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function throwRequestError(response, fallbackMessage) {
  const errorData = await parseJsonSafely(response);
  throw new Error(errorData?.message || fallbackMessage);
}

export async function listCategories() {
  const response = await fetch(CATEGORY_API_BASE);

  if (!response.ok) {
    throw new Error("Failed to connect to the backend interface. Please check if the backend is running.");
  }

  const result = await response.json();
  return result.data;
}

export async function createCategory(category) {
  const response = await fetch(CATEGORY_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to create category");
  }

  const result = await response.json();
  return result.data;
}

export async function updateCategory(id, { name, description, status } = {}) {
  const payload = {
    name,
    description,
    status,
  };

  const response = await fetch(`${CATEGORY_API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to update category");
  }

  const result = await response.json();
  return result.data;
}

export async function updateCategoryStatus(id, newStatus) {
  const response = await fetch(`${CATEGORY_API_BASE}/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newStatus),
  });

  if (!response.ok) {
    await throwRequestError(response, "Failed to update status");
  }

  const result = await response.json();
  return result.data;
}

export default {
  listCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};
