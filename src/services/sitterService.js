import api from './api';

// --- Auth (for context, not used in the form directly) ---
export const loginWithEmail = (email) => api.post('/auth/email/login', { email });
export const verifyEmailOtp = (email, otp) => api.post('/auth/email/verify', { email, otp });

// --- Sitter Profile Onboarding ---

export const getSitterProfile = () => api.get('/sitters/me');

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/sitters/upload-profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (response.data && response.data.url && response.data.url.startsWith('http://')) {
    response.data.url = response.data.url.replace('http://', 'https://');
  }
  return response;
};

/**
 * Uploads multiple photos to the user's gallery.
 * @param {File[]} files An array of image files to upload.
 * @returns {Promise<Object>} The response containing the photo URLs.
 */
export const uploadGalleryPhotos = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await api.post('/sitters/upload-gallery-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Assuming the response returns a list of URLs, ensure they are all HTTPS
  if (response.data && Array.isArray(response.data.urls)) {
    response.data.urls = response.data.urls.map(url => 
      url.startsWith('http://') ? url.replace('http://', 'https://') : url
    );
  }
  return response;
};

export const updatePersonalInfo = (data) => api.patch('/sitters/personal-info', data);
export const updateLocation = (data) => api.patch('/sitters/location', data);
export const updateBoardingService = (data) => api.patch('/sitters/services/boarding', data);
export const updateWalkingService = (data) => api.patch('/sitters/services/walking', data);
export const updateExperience = (data) => api.patch('/sitters/experience', data);
export const updateHome = (data) => api.patch('/sitters/home', data);
export const updateContent = (data) => api.patch('/sitters/content', data);
export const updatePricing = (data) => api.patch('/sitters/pricing', data);
export const submitForReview = () => api.post('/sitters/submit-review');

// --- Verification (Placeholder) ---
export const submitIdentityVerification = (formData) => {
  return api.post('/verification/id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const submitBackgroundCheck = (data) => {
  return api.post('/verification/background', data);
};
