import axiosInstance from '../../common/api/axiosInstance';

export const getProfile = () => axiosInstance.get('/users/me');
export const updateProfile = (data) => axiosInstance.put('/users/profile', data);
export const applyForContributor = (reason, files = []) => {
  const form = new FormData();
  form.append('reason', reason);
  files.forEach((file) => form.append('files', file));
  return axiosInstance.post('/users/apply-contributor', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getApplications = () => axiosInstance.get('/admin/users/applications');
export const getApplication = (id) => axiosInstance.get(`/admin/users/applications/${id}`);
export const approveApplication = (id) => axiosInstance.put(`/admin/users/applications/${id}/approve`);
export const rejectApplication = (id, reason) => axiosInstance.put(`/admin/users/applications/${id}/reject`, { reason });
