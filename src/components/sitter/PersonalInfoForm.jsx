import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useCallback } from 'react';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, CheckCircle } from 'lucide-react';

const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  date_of_birth: z.string().refine(val => new Date(val) >= new Date('1900-01-01'), "Please enter a valid date of birth."),
  phone_number: z.string().optional(),
  national_code: z.string().min(10, "National code must be 10 digits.").max(10, "National code must be 10 digits."),
  postal_code: z.string().min(10, "Postal code must be 10 digits.").max(10, "Postal code must be 10 digits."),
  address: z.string().min(5, "Address is required."),
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
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch, setError, clearErrors } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      full_name: '', date_of_birth: '', phone_number: '', national_code: '',
      postal_code: '', address: '', emergency_contact_name: '', emergency_contact_phone: '',
    }
  });

  const phoneNumber = watch('phone_number');
  const postalCode = watch('postal_code');

  useEffect(() => {
    if (profileData) {
      reset({
        ...profileData,
        national_code: profileData.government_id_number || '',
      });
      setPhotoPreview(profileData.profile_photo);
      if (profileData.is_phone_verified) {
        setIsPhoneVerified(true);
      }
    }
  }, [profileData, reset]);

  const handleAddressFetch = useCallback(async (code) => {
    if (code.length === 10 && !profileData?.address) {
      setIsFetchingAddress(true);
      try {
        const response = await SitterService.getAddressFromPostalCode(code);
        const addressData = response.data.address;
        if (addressData) {
          const fullAddress = [
            addressData.province, addressData.town, addressData.district,
            addressData.street2, addressData.street,
            `Building: ${addressData.building_name}`, `Number: ${addressData.number}`,
            `Floor: ${addressData.floor}`, `Side Floor: ${addressData.side_floor}`
          ].filter(part => part && part.trim() !== '' && !part.includes('null')).join(', ');
          setValue('address', fullAddress);
          clearErrors('address');
        } else {
           setError('address', { type: 'manual', message: 'Could not find address. Please enter it manually.' });
        }
      } catch (error) {
        setError('address', { type: 'manual', message: 'Could not find address. Please enter it manually.' });
      } finally {
        setIsFetchingAddress(false);
      }
    }
  }, [setValue, setError, clearErrors, profileData?.address]);

  useEffect(() => {
    handleAddressFetch(postalCode);
  }, [postalCode, handleAddressFetch]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); clearErrors("profile_photo"); }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) { setDocumentFile(file); clearErrors("government_id_image"); }
  };

  const getFormattedPhoneNumber = () => {
    return phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
  };

  const handleSendOtp = async () => {
    setResendTimer(120);
    try {
      await SitterService.requestMobileOtp(getFormattedPhoneNumber());
      setOtpSent(true);
      addToast({ title: "OTP Sent", description: "An OTP has been sent to your phone." });
    } catch (error) {
      addToast({ title: "Error", description: "Could not send OTP.", variant: "destructive" });
      setResendTimer(0);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await SitterService.verifySitterPhone(getFormattedPhoneNumber(), otp);
      setIsPhoneVerified(true);
      addToast({ title: "Success", description: "Phone number verified." });
    } catch (error) {
      addToast({ title: "Verification Failed", description: "Incorrect OTP.", variant: "destructive" });
    }
  };

  const onSubmit = async (formData) => {
    if (!isPhoneVerified) {
      addToast({ title: "Verification Required", description: "Please verify your phone number.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let photoUrl = profileData?.profile_photo || null;
      let docUrl = profileData?.government_id_image || null;

      if (photoFile) {
        const photoRes = await SitterService.uploadProfilePhoto(photoFile);
        photoUrl = photoRes.data.profile_photo;
      }
      
      if (documentFile) {
        const docRes = await SitterService.uploadIdDocument(documentFile);
        docUrl = docRes.data.government_id_image;
      }

      if (!photoUrl) { setError("profile_photo", { type: "manual", message: "Profile photo is required." }); setIsSubmitting(false); return; }
      if (!docUrl) { setError("government_id_image", { type: "manual", message: "ID document is required." }); setIsSubmitting(false); return; }

      const finalData = { 
        ...formData, 
        profile_photo: photoUrl, 
        government_id_image: docUrl,
        government_id_type: "national_id",
        government_id_number: formData.national_code,
      };
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
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register('address')} disabled={isFetchingAddress} placeholder={isFetchingAddress ? "Fetching address..." : "Enter your full address"} />
            {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number</Label>
            {isPhoneVerified ? (
              <p className="text-sm text-green-600 font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Your phone number ({profileData?.phone_number}) is verified.</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input {...register('phone_number')} placeholder="e.g., 09123456789" />
                  <Button type="button" onClick={handleSendOtp} disabled={phoneNumber?.length < 11 || resendTimer > 0}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : (otpSent ? 'Resend OTP' : 'Send OTP')}
                  </Button>
                </div>
                {errors.phone_number && <p className="text-sm text-red-600">{errors.phone_number.message}</p>}
              </>
            )}
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
                <span className="text-sm text-gray-600">{documentFile ? documentFile.name : (profileData?.government_id_image ? "Document on file" : "Click to upload")}</span>
              </Label>
              <Input id="document-upload" type="file" accept="image/*,application/pdf" onChange={handleDocumentChange} className="hidden" />
              {errors.government_id_image && <p className="text-sm text-red-600">{errors.government_id_image.message}</p>}
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
