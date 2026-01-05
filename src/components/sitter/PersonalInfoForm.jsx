import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';

const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  date_of_birth: z.string().refine(val => new Date(val) >= new Date('1900-01-01'), "Please enter a valid date of birth."),
  phone_number: z.string().min(10, "A valid phone number is required."),
  national_code: z.string().min(10, "National code must be 10 digits.").max(10, "National code must be 10 digits."),
  postal_code: z.string().min(10, "Postal code must be 10 digits.").max(10, "Postal code must be 10 digits."),
  emergency_contact_name: z.string().min(2, "Emergency contact is required."),
  emergency_contact_phone: z.string().min(10, "A valid phone number is required."),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600 mt-1">{error.message}</p>}
    </div>
);

const PersonalInfoForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otp, setOtp] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch, setError, clearErrors } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      full_name: '', date_of_birth: '', phone_number: '', national_code: '',
      postal_code: '', emergency_contact_name: '', emergency_contact_phone: '',
    }
  });

  const phoneNumber = watch('phone_number');

  useEffect(() => {
    if (profileData) {
      reset(profileData);
      setPhotoPreview(profileData.profile_photo);
      setIsPhoneVerified(profileData.is_phone_verified || false);
    }
  }, [profileData, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      clearErrors("profile_photo");
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      clearErrors("id_document");
    }
  };

  const handleSendOtp = async () => {
    try {
      await SitterService.requestMobileOtp(phoneNumber);
      setOtpSent(true);
      addToast({ title: "OTP Sent", description: "An OTP has been sent to your phone." });
    } catch (error) {
      addToast({ title: "Error", description: "Could not send OTP. Please check the phone number.", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await SitterService.verifyMobileOtp(phoneNumber, otp);
      setIsPhoneVerified(true);
      addToast({ title: "Success", description: "Your phone number has been verified." });
    } catch (error) {
      addToast({ title: "Verification Failed", description: "The OTP is incorrect. Please try again.", variant: "destructive" });
    }
  };

  const onSubmit = async (formData) => {
    if (!isPhoneVerified) {
      addToast({ title: "Verification Required", description: "Please verify your phone number before continuing.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let photoUrl = photoPreview;
      if (photoFile) {
        const photoRes = await SitterService.uploadProfilePhoto(photoFile);
        photoUrl = photoRes.data.url;
      }
      
      let docUrl = profileData?.id_document;
      if (documentFile) {
        const docRes = await SitterService.uploadIdDocument(documentFile);
        docUrl = docRes.data.url;
      }

      if (!photoUrl) {
        setError("profile_photo", { type: "manual", message: "Profile photo is required." });
        setIsSubmitting(false);
        return;
      }
      if (!docUrl) {
        setError("id_document", { type: "manual", message: "ID document is required." });
        setIsSubmitting(false);
        return;
      }

      const finalData = { ...formData, profile_photo: photoUrl, id_document: docUrl };
      const response = await SitterService.updatePersonalInfo(finalData);
      onSave(response.data);
    } catch (err) {
      addToast({ title: "Save Failed", description: err.response?.data?.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="border-neutral-gray shadow-md">
        <CardHeader>
          <CardTitle>Personal Information & Verification</CardTitle>
          <CardDescription>This information is for verification and will not be shared publicly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="full_name" label="Full Name" register={register} error={errors.full_name} />
            <Field name="date_of_birth" label="Date of Birth" type="date" register={register} error={errors.date_of_birth} />
            <Field name="national_code" label="National Code" register={register} error={errors.national_code} />
            <Field name="postal_code" label="Postal Code" register={register} error={errors.postal_code} />
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number Verification</Label>
            <div className="flex gap-2">
              <Input {...register('phone_number')} placeholder="e.g., 09123456789" disabled={isPhoneVerified || otpSent} />
              {!isPhoneVerified && (
                <Button type="button" onClick={handleSendOtp} disabled={otpSent}>
                  {otpSent ? 'OTP Sent' : 'Send OTP'}
                </Button>
              )}
            </div>
            {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number.message}</p>}
            {isPhoneVerified && <p className="text-sm text-green-600">Phone number verified!</p>}
          </div>

          {otpSent && !isPhoneVerified && (
            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <div className="flex gap-2">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
                <Button type="button" onClick={handleVerifyOtp}>Verify</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <img src={photoPreview || 'https://via.placeholder.com/96'} alt="Preview" className="h-24 w-24 rounded-full object-cover bg-gray-200" />
                <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="max-w-xs" />
              </div>
              {errors.profile_photo && <p className="text-sm text-red-600">{errors.profile_photo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ID Document (National ID Card)</Label>
              <Label htmlFor="document-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-neutral-light-gray">
                <UploadCloud className="h-8 w-8 text-gray-500" />
                <span className="text-sm text-gray-600">{documentFile ? documentFile.name : 'Click to upload'}</span>
              </Label>
              <Input id="document-upload" type="file" accept="image/*,application/pdf" onChange={handleDocumentChange} className="hidden" />
              {errors.id_document && <p className="text-sm text-red-600">{errors.id_document.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="emergency_contact_name" label="Emergency Contact Name" register={register} error={errors.emergency_contact_name} />
            <Field name="emergency_contact_phone" label="Emergency Contact Phone" register={register} error={errors.emergency_contact_phone} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack} disabled={true}>Back</Button>
          <Button type="submit" disabled={isSubmitting || !isPhoneVerified}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default PersonalInfoForm;
