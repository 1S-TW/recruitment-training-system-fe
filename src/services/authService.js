import api from './api';

// Phải có "export" ở đây
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

// Phải có "export" ở đây
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

// Phải có "export" ở đây
export const forgotPassword = async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
};

// Phải có "export" ở đây
export const verifyEmail = async (token) => {
    const response = await api.get(`/auth/verify?token=${token}`);
    return response.data;
};

// Phải có "export" ở đây
export const resetPassword = async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
};