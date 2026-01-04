import api from './api';

// --- Auth (for context, not used in the form directly) ---
export const loginWithEmail = (email) => api.post('/auth/email/login', { email });
export const verifyEmailOtp = (email, otp) => api.post('/auth/email/verify', { email, otp });

// --- Sitter Profile Onboarding ---

/**
 * Fetches the current sitter's profile to resume onboarding.
 */
export const getSitterProfile = () => api.get('/sitters/me');

/**
 * Uploads the user's profile photo.
 * @param {File} file The image file to upload.
 * @returns {Promise<Object>} The response containing the photo URL.
 */
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/sitters/upload-profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Fix for Mixed Content error: Ensure URL is HTTPS.
  if (response.data && response.data.url && response.data.url.startsWith('http://')) {
    response.data.url = response.data.url.replace('http://', 'https://');
  }
  
  return response;
};

/**
 * Step 1: Updates personal information.
 * Assumes photo has been uploaded and its URL is included in the data.
 */
export const updatePersonalInfo = (data) => {
  return api.patch('/sitters/personal-info', data);
};

/**
 * Updates location and availability.
 */
export const updateLocation = (data) => api.patch('/sitters/location', data);

/**
 * Updates boarding service configuration.
 */
export const updateBoardingService = (data) => api.patch('/sitters/services/boarding', data);

/**
 * Updates walking service configuration.
 */
export const updateWalkingService = (data) => api.patch('/sitters/services/walking', data);

/**
 * Updates experience and skills.
 */
export const updateExperience = (data) => api.patch('/sitters/experience', data);

/**
 * Updates home environment details.
 */
export const updateHome = (data) => api.patch('/sitters/home', data);

/**
 * Updates profile content like headline and bio.
 */
export const updateContent = (data) => api.patch('/sitters/content', data);

/**
 * Updates pricing and payout information.
 */
export const updatePricing = (data) => api.patch('/sitters/pricing', data);

/**
 * Submits the completed profile for review.
 */
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
