import api from './api';

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const googleLogin = async (idToken) => {
  const response = await api.post('/auth/google', { id_token: idToken });
  return response.data;
};

export const requestEmailOtp = async (email) => {
  const response = await api.post('/auth/email/login', { email });
  return response.data;
};

export const verifyEmailOtp = async (email, otp) => {
  const response = await api.post('/auth/email/verify', { email, otp });
  return response.data;
};
