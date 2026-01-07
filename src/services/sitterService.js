import api from './api';

// --- Auth & Verification ---
export const requestEmailOtp = (email) => api.post('/auth/email/login', { email });
export const verifyEmailOtp = (email, otp) => api.post('/auth/email/verify', { email, otp });
export const requestMobileOtp = (phone_number) => api.post('/auth/mobile/login', { phone_number });
export const verifySitterPhone = (phone, otp) => api.post('/sitters/verify-phone-update', { phone, otp });

// --- Utils ---
export const getAddressFromPostalCode = (postal_code) => {
  return api.post('/verification/postal-code', { postal_code });
};

// --- Sitter Profile Onboarding ---
export const getSitterProfile = () => api.get('/sitters/me');

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/sitters/upload-profile-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
  return response;
};

export const deleteGalleryPhotos = (photos) => {
  return api.post('/sitters/delete-gallery-photos', { photos });
};

export const uploadIdDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/sitters/upload-id-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
};

export const updatePersonalInfo = (data) => api.patch('/sitters/personal-info', data);
export const updateLocation = (data) => api.patch('/sitters/location', data);
export const updateServiceSelection = (data) => api.patch('/sitters/services/selection', data);
export const updateBoardingService = (data) => api.patch('/sitters/services/boarding', data);
export const updateWalkingService = (data) => api.patch('/sitters/services/walking', data);
export const updateHouseSittingService = (data) => api.patch('/sitters/services/house-sitting', data);
export const updateDropInService = (data) => api.patch('/sitters/services/drop-in', data);
export const updateDayCareService = (data) => api.patch('/sitters/services/daycare', data);
export const updateExperience = (data) => api.patch('/sitters/experience', data);
export const updateHome = (data) => api.patch('/sitters/home', data);
export const updateContent = (data) => api.patch('/sitters/content', data);
export const updatePricing = (data) => api.patch('/sitters/pricing', data);
export const submitForReview = () => api.post('/sitters/submit-review');
