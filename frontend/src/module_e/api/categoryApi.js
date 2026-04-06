import axiosInstance from '../../common/api/axiosInstance';

export async function listCategories() {
  const response = await axiosInstance.get('/admin/categories');
  return response.data.data;
}

export async function createCategory(category) {
  const response = await axiosInstance.post('/admin/categories', category);
  return response.data.data;
}

export async function updateCategory(id, { name, description, status } = {}) {
  const response = await axiosInstance.put(`/admin/categories/${id}`, { name, description, status });
  return response.data.data;
}

export async function updateCategoryStatus(id, newStatus) {
  const response = await axiosInstance.patch(`/admin/categories/${id}/status`, newStatus);
  return response.data.data;
}

export default {
  listCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
};
