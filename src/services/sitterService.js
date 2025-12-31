import api from './api';

export const getSitterProfile = async () => {
  const response = await api.get('/sitters/me');
  return response.data;
};

export const updatePersonalInfo = async (data) => {
  const response = await api.patch('/sitters/personal-info', data);
  return response.data;
};

export const updateLocation = async (data) => {
  const response = await api.patch('/sitters/location', data);
  return response.data;
};

export const updateBoardingService = async (data) => {
  const response = await api.patch('/sitters/services/boarding', data);
  return response.data;
};

export const updateWalkingService = async (data) => {
  const response = await api.patch('/sitters/services/walking', data);
  return response.data;
};

export const updateExperience = async (data) => {
  const response = await api.patch('/sitters/experience', data);
  return response.data;
};

export const updateHome = async (data) => {
  const response = await api.patch('/sitters/home', data);
  return response.data;
};

export const updateContent = async (data) => {
  const response = await api.patch('/sitters/content', data);
  return response.data;
};

export const updatePricing = async (data) => {
  const response = await api.patch('/sitters/pricing', data);
  return response.data;
};
