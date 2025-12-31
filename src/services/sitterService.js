import api from './api';

// --- Profile & Onboarding ---

export const getSitterProfile = async () => {
  const response = await api.get('/sitters/me');
  return response.data;
};

export const updatePersonalInfo = async (formData) => {
  const response = await api.patch('/sitters/personal-info', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateLocation = async (data) => {
  const response = await api.patch('/sitters/location', data);
  return response.data;
};

export const updateExperience = async (formData) => {
  const response = await api.patch('/sitters/experience', formData, {
     headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateHome = async (data) => {
  const response = await api.patch('/sitters/home', data);
  return response.data;
};

export const updateContent = async (formData) => {
  const response = await api.patch('/sitters/content', formData, {
     headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// --- Service-specific ---
// These now accept the full configuration for the service
export const updateBoardingService = async (data) => {
  const response = await api.patch('/sitters/services/boarding', data);
  return response.data;
};

export const updateWalkingService = async (data) => {
  const response = await api.patch('/sitters/services/walking', data);
  return response.data;
};

// --- Pricing, Payouts, & Verification ---

export const updatePricing = async (data) => {
  const response = await api.patch('/sitters/pricing', data);
  return response.data;
};

export const setupPayouts = async (data) => {
  const response = await api.post('/payouts/setup', data);
  return response.data;
};

export const submitIdentityVerification = async (formData) => {
  const response = await api.post('/verification/id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitBackgroundCheck = async (data) => {
  const response = await api.post('/verification/background', data);
  return response.data;
};

// --- Final Submission ---

export const submitForReview = async () => {
  const response = await api.post('/sitters/submit-review');
  return response.data;
};
