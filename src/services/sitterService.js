import api from './api';

// --- Auth & Verification ---
export const requestEmailOtp = (email) => api.post('/auth/email/login', { email });
export const verifyEmailOtp = (email, otp) => api.post('/auth/email/verify', { email, otp });
export const requestMobileOtp = (phone_number) => api.post('/auth/mobile/login', { phone_number });
export const verifyMobileOtp = (phone_number, otp) => api.post('/auth/mobile/verify', { phone_number, otp });

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

export const uploadGalleryPhotos = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  const response = await api.post('/sitters/upload-gallery-photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (response.data && Array.isArray(response.data.urls)) {
    response.data.urls = response.data.urls.map(url => 
      url.startsWith('http://') ? url.replace('http://', 'https://') : url
    );
  }
  return response;
};

export const deleteGalleryPhotos = (photos) => {
  return api.post('/sitters/delete-gallery-photos', { photos });
};

/**
 * Uploads the user's ID document.
 * @param {File} file The document file to upload.
 * @returns {Promise<Object>} The response containing the document URL.
 */
export const uploadIdDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    // Assuming an endpoint like this exists based on the other upload endpoints.
    // This may need to be adjusted based on the actual API spec.
    const response = await api.post('/sitters/upload-id-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data && response.data.url && response.data.url.startsWith('http://')) {
        response.data.url = response.data.url.replace('http://', 'https://');
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
