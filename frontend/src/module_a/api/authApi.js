import axiosInstance from '../../common/api/axiosInstance';

export const register = (data) => axiosInstance.post('/auth/register', data);
export const login = (credentials) => axiosInstance.post('/auth/login', credentials);
export const verifyEmail = (token) => axiosInstance.get(`/auth/verify-email?token=${token}`);
export const logoutApi = () => axiosInstance.post('/auth/logout');
