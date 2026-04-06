import axiosInstance from '../../common/api/axiosInstance';

export async function getTags() {
  const response = await axiosInstance.get('/admin/tags');
  return response.data.data;
}

export async function createTag(data) {
  const response = await axiosInstance.post('/admin/tags', data);
  return response.data.data;
}

export async function restoreTag(id) {
  const response = await axiosInstance.patch(`/admin/tags/${id}/restore`);
  return response.data.data;
}

export async function updateTag(id, data) {
  const response = await axiosInstance.put(`/admin/tags/${id}`, data);
  return response.data.data;
}

export async function deleteTag(id) {
  const response = await axiosInstance.delete(`/admin/tags/${id}`);
  return response.data.data;
}

export default {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  restoreTag,
};
