import api from './api';

// --- Auth (for context, not used in the form directly) ---
export const loginWithEmail = (email) => api.post('/auth/email/login', { email });
export const verifyEmailOtp = (email, otp) => api.post('/auth/email/verify', { email, otp });

// --- Sitter Profile Onboarding (Step-by-Step) ---

/**
 * Fetches the current sitter's profile to resume onboarding.
 */
export const getSitterProfile = () => api.get('/sitters/me');

/**
 * Step 2: Updates personal information. Handles profile photo upload.
 */
export const updatePersonalInfo = (data) => {
  // The API expects a multipart form if a photo is included.
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key]) {
      formData.append(key, data[key]);
    }
  });
  return api.patch('/sitters/personal-info', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Step 3: Updates location and availability.
 */
export const updateLocation = (data) => api.patch('/sitters/location', data);

/**
 * Step 5 (Dynamic): Updates boarding service configuration.
 */
export const updateBoardingService = (data) => api.patch('/sitters/services/boarding', data);

/**
 * Step 5 (Dynamic): Updates walking service configuration.
 */
export const updateWalkingService = (data) => api.patch('/sitters/services/walking', data);

/**
 * Step 6: Updates experience and skills.
 */
export const updateExperience = (data) => api.patch('/sitters/experience', data);

/**
 * Step 7: Updates home environment details.
 */
export const updateHome = (data) => api.patch('/sitters/home', data);

/**
 * Step 9: Updates profile content like headline and bio.
 */
export const updateContent = (data) => api.patch('/sitters/content', data);

/**
 * Step 10: Updates pricing and payout information.
 */
export const updatePricing = (data) => api.patch('/sitters/pricing', data);

/**
 * Step 11: Submits the completed profile for review.
 * NOTE: This endpoint is assumed from the UX flow. If not present in the backend,
 * this will fail. The backend might trigger this automatically on the last pricing update.
 */
export const submitForReview = () => api.post('/sitters/submit-review');

// --- Verification (Placeholder based on UX doc) ---
// The OpenAPI spec provided does not include these endpoints.
// These are placeholders and will fail if not implemented in the backend.

export const submitIdentityVerification = (formData) => {
  return api.post('/verification/id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const submitBackgroundCheck = (data) => {
  return api.post('/verification/background', data);
};
