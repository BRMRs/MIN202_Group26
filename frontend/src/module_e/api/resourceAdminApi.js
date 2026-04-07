import axiosInstance from '../../common/api/axiosInstance';

export async function listAdminResources() {
  const response = await axiosInstance.get('/admin/resources');
  return response.data.data;
}

export async function getAdminResourceDetail(id) {
  const response = await axiosInstance.get(`/admin/resources/${id}`);
  return response.data.data;
}

export async function unpublishAdminResource(id) {
  const response = await axiosInstance.patch(`/admin/resources/${id}/unpublish`);
  return response.data.data;
}

export async function archiveAdminResource(id, reason) {
  const response = await axiosInstance.patch(`/admin/resources/${id}/archive`, { reason });
  return response.data.data;
}

export async function republishAdminResource(id, categoryId) {
  const response = await axiosInstance.patch(`/admin/resources/${id}/republish`, { categoryId });
  return response.data.data;
}

export async function updateAdminResourceCategory(id, categoryId) {
  const response = await axiosInstance.patch(`/admin/resources/${id}/category`, { categoryId });
  return response.data.data;
}

export default {
  listAdminResources,
  getAdminResourceDetail,
  unpublishAdminResource,
  archiveAdminResource,
  republishAdminResource,
  updateAdminResourceCategory,
};
