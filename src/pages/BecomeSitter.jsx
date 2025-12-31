import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { getSitterProfile, updatePersonalInfo, updateLocation } from '@/services/sitterService';
import { useAuth } from '@/hooks/useAuth';

// --- Schemas ---

const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine((val) => {
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, "You must be at least 18 years old"),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(10, "Valid phone number is required"),
});

const locationSchema = z.object({
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  service_radius_km: z.coerce.number().min(1, "Radius must be at least 1km").max(50, "Radius cannot exceed 50km"),
  // Simplified for now - in a real app you'd use a map picker for lat/lng
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

// --- Components ---

const PersonalInfoStep = ({ defaultValues, onNext }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Tell us a bit about yourself. This helps build trust with pet owners.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" {...register("full_name")} placeholder="John Doe" />
            {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input id="emergency_contact_name" {...register("emergency_contact_name")} placeholder="Jane Doe" />
            {errors.emergency_contact_name && <p className="text-sm text-red-500">{errors.emergency_contact_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} placeholder="+1234567890" />
            {errors.emergency_contact_phone && <p className="text-sm text-red-500">{errors.emergency_contact_phone.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const LocationStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      ...defaultValues,
      // Default values if not present
      latitude: defaultValues?.latitude || 0,
      longitude: defaultValues?.longitude || 0,
      available_days: [],
      available_time_slots: {},
      blackout_dates: [],
      availability_type: 'part_time'
    }
  });

  const onSubmit = async (data) => {
    // Add required fields that are hidden/defaulted for now
    const payload = {
      ...data,
      latitude: 0, // Mock lat
      longitude: 0, // Mock lng
      availability_type: 'part_time',
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Mock default
      available_time_slots: {},
      blackout_dates: []
    };
    await onNext(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Availability</CardTitle>
        <CardDescription>Where do you want to offer your services?</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="United States" />
            {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} placeholder="New York" />
            {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_radius_km">Service Radius (km)</Label>
            <Input 
              id="service_radius_km" 
              type="number" 
              {...register("service_radius_km")} 
              placeholder="10" 
            />
            {errors.service_radius_km && <p className="text-sm text-red-500">{errors.service_radius_km.message}</p>}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>📍 Map selection and detailed availability calendar will be available in the next update.</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const ServicesStep = ({ onNext, onBack }) => {
  // Placeholder for service selection
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Services</CardTitle>
        <CardDescription>Select the services you want to offer.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {['Boarding', 'House Sitting', 'Drop-In Visits', 'Dog Walking', 'Doggy Day Care', 'Dog Training'].map((service) => (
          <div key={service} className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <input type="checkbox" id={service} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <label htmlFor={service} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              {service}
            </label>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
        <Button onClick={() => onNext({})} className="w-full">Continue</Button>
      </CardFooter>
    </Card>
  );
};

// --- Main Component ---

const BecomeSitter = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getSitterProfile();
        setProfile(data);
        // Logic to restore step could go here
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePersonalInfoSubmit = async (data) => {
    try {
      await updatePersonalInfo(data);
      // Update local profile state
      setProfile(prev => ({ ...prev, ...data }));
      setStep(2);
    } catch (error) {
      console.error("Error updating personal info:", error);
    }
  };

  const handleLocationSubmit = async (data) => {
    try {
      await updateLocation(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(3);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleServicesSubmit = async (data) => {
    // Placeholder for service update logic
    alert("Services selection saved! (Mock)");
    // setStep(4); 
  };

  if (loadingProfile) return <div className="flex justify-center p-10">Loading profile...</div>;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Become a Sitter</h1>
          <span className="text-sm text-gray-500">Step {step} of 8</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(step / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {step === 1 && (
        <PersonalInfoStep 
          defaultValues={{
            full_name: profile?.full_name || user?.full_name || '',
            date_of_birth: profile?.date_of_birth || '',
            emergency_contact_name: profile?.emergency_contact_name || '',
            emergency_contact_phone: profile?.emergency_contact_phone || '',
          }} 
          onNext={handlePersonalInfoSubmit} 
        />
      )}

      {step === 2 && (
        <LocationStep 
          defaultValues={{
            country: profile?.country || '',
            city: profile?.city || '',
            service_radius_km: profile?.service_radius_km || 10,
          }}
          onNext={handleLocationSubmit}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <ServicesStep 
          onNext={handleServicesSubmit}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
};

export default BecomeSitter;
