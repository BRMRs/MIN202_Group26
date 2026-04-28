import axiosInstance from '../../common/api/axiosInstance';

export const register = (data) => axiosInstance.post('/auth/register', data);
export const login = (credentials) => axiosInstance.post('/auth/login', credentials);
export const verifyEmail = (token) => axiosInstance.get(`/auth/verify-email?token=${token}`);
export const sendVerificationCode = (email) => axiosInstance.post('/auth/send-code', { email });
export const verifyCodeAndRegister = (data) => axiosInstance.post('/auth/verify-code-and-register', data);
export const sendResetCode = (email) => axiosInstance.post('/auth/send-reset-code', { email });
export const verifyResetCode = (data) => axiosInstance.post('/auth/verify-reset-code', data);
export const resetPassword = (data) => axiosInstance.post('/auth/reset-password', data);

