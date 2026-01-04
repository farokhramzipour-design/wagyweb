import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import * as SitterService from '@/services/sitterService';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

// Schema for validation
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters."),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date' && new Date().getFullYear() - new Date(val).getFullYear() >= 18, "You must be at least 18 years old."),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required."),
  emergency_contact_phone: z.string().min(10, "Please enter a valid phone number."),
  profile_photo: z.string().optional(), // URL will be stored here
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name} className="text-brand-charcoal">{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const PersonalInfoForm = ({ profileData, onSave }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profileData?.profile_photo || null);

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
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      addToast({ title: "Invalid File", description: "Please select a valid image file.", variant: "destructive" });
    }
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let photoUrl = profileData?.profile_photo;

      if (photoFile) {
        const uploadResponse = await SitterService.uploadProfilePhoto(photoFile);
        photoUrl = uploadResponse.data.url;
        setValue('profile_photo', photoUrl);
      }
      
      if (!photoUrl) {
        addToast({ title: "Photo Required", description: "Please upload a profile photo.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const finalData = { ...formData, profile_photo: photoUrl };
      await SitterService.updatePersonalInfo(finalData);
      
      onSave(finalData);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      addToast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="border-neutral-gray shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-charcoal">Personal Information</CardTitle>
          <CardDescription>Tell us a bit about yourself. This information will be used to build your sitter profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-neutral-light-gray rounded-lg">
            <Label className="text-brand-charcoal">Profile Photo <span className="text-red-500">*</span></Label>
            <p className="text-sm text-gray-600 mt-1">Pet parents love seeing who you are! A clear, friendly photo builds trust.</p>
            <div className="flex items-center gap-4 mt-3">
              <img 
                src={photoPreview || 'https://via.placeholder.com/96'} 
                alt="Profile Preview" 
                className="h-24 w-24 rounded-full object-cover bg-neutral-gray"
              />
              <Input id="photo" type="file" accept="image/png, image/jpeg" onChange={handlePhotoChange} className="max-w-xs"/>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="full_name" label="Full Name" register={register} error={errors.full_name} placeholder="e.g., Jane Doe" />
            <Field name="date_of_birth" label="Date of Birth" type="date" register={register} error={errors.date_of_birth} />
            <Field name="emergency_contact_name" label="Emergency Contact Name" register={register} error={errors.emergency_contact_name} placeholder="e.g., John Smith" />
            <Field name="emergency_contact_phone" label="Emergency Contact Phone" type="tel" register={register} error={errors.emergency_contact_phone} placeholder="(555) 123-4567" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="submit" disabled={isSubmitting} className="bg-brand-green hover:bg-opacity-90 text-white">
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default PersonalInfoForm;
