import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import * as SitterService from '@/services/sitterService';

// Schema for validation
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date' && new Date().getFullYear() - new Date(val).getFullYear() >= 18, "You must be at least 18 years old."),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(10, "A valid phone number is required"),
  profile_photo: z.string().optional(), // URL will be stored here
});

const PersonalInfoForm = ({ profileData, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profileData?.profile_photo || null);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      full_name: profileData?.full_name || '',
      date_of_birth: profileData?.date_of_birth ? new Date(profileData.date_of_birth).toISOString().split('T')[0] : '',
      emergency_contact_name: profileData?.emergency_contact_name || '',
      emergency_contact_phone: profileData?.emergency_contact_phone || '',
      profile_photo: profileData?.profile_photo || '',
    }
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      let photoUrl = profileData?.profile_photo;

      // 1. Upload photo if a new one is selected
      if (photoFile) {
        const uploadResponse = await SitterService.uploadProfilePhoto(photoFile);
        photoUrl = uploadResponse.data.url; // Assuming the URL is in `data.url`
        setValue('profile_photo', photoUrl);
      }
      
      if (!photoUrl) {
        throw new Error("Profile photo is mandatory.");
      }

      // 2. Submit personal info with the photo URL
      const finalData = { ...formData, profile_photo: photoUrl };
      await SitterService.updatePersonalInfo(finalData);
      
      onSave(finalData); // Callback to parent
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      setError(errorMessage);
      console.error("Failed to save personal info:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
          Profile Photo
          <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500">Pet parents love seeing who you are!</p>
        <div className="mt-2 flex items-center gap-4">
          {photoPreview && <img src={photoPreview} alt="Profile Preview" className="h-24 w-24 rounded-full object-cover" />}
          <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
        </div>
      </div>

      {/* Form Fields */}
      <div>
        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" {...register('full_name')} />
        {errors.full_name && <p className="text-red-500">{errors.full_name.message}</p>}
      </div>
      <div>
        <label htmlFor="date_of_birth">Date of Birth</label>
        <input id="date_of_birth" type="date" {...register('date_of_birth')} />
        {errors.date_of_birth && <p className="text-red-500">{errors.date_of_birth.message}</p>}
      </div>
      <div>
        <label htmlFor="emergency_contact_name">Emergency Contact Name</label>
        <input id="emergency_contact_name" {...register('emergency_contact_name')} />
        {errors.emergency_contact_name && <p className="text-red-500">{errors.emergency_contact_name.message}</p>}
      </div>
      <div>
        <label htmlFor="emergency_contact_phone">Emergency Contact Phone</label>
        <input id="emergency_contact_phone" {...register('emergency_contact_phone')} />
        {errors.emergency_contact_phone && <p className="text-red-500">{errors.emergency_contact_phone.message}</p>}
      </div>
      
      {error && <p className="text-red-500 font-bold">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save & Continue'}
      </button>
    </form>
  );
};

export default PersonalInfoForm;
