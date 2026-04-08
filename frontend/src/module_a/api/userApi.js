import axiosInstance from '../../common/api/axiosInstance';

export const getProfile = () => axiosInstance.get('/users/me');
export const updateProfile = (data) => axiosInstance.put('/users/profile', data);
export const applyForContributor = (reason) => axiosInstance.post('/users/apply-contributor', { reason });
export const getApplications = () => axiosInstance.get('/admin/users/applications');
export const approveApplication = (id) => axiosInstance.put(`/admin/users/applications/${id}/approve`);
export const rejectApplication = (id) => axiosInstance.put(`/admin/users/applications/${id}/reject`);
