import { useForm, Controller } from 'react-hook-form';
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
const locationSchema = z.object({
  country: z.string().min(2, "Country is required."),
  city: z.string().min(2, "City is required."),
  // Assuming lat/lng are handled by a geocoding service in a real app, we'll omit them from the form for now.
  service_radius_km: z.coerce.number().min(1, "Service radius must be at least 1km.").max(100, "Service radius cannot exceed 100km."),
  available_days: z.array(z.string()).min(1, "Please select at least one available day."),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name} className="text-brand-charcoal">{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const Checkbox = ({ name, value, label, register }) => (
    <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green">
        <input type="checkbox" {...register(name)} value={value} className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green opacity-0 absolute" />
        <span>{label}</span>
    </label>
);


const LocationForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: profileData?.location?.country || 'USA',
      city: profileData?.location?.city || '',
      service_radius_km: profileData?.location?.service_radius_km || 10,
      available_days: profileData?.location?.available_days || [],
    }
  });

  const radius = watch('service_radius_km');
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // In a real app, you'd get lat/lng from a geocoding API based on the city.
      const dataToSave = { 
        ...formData,
        latitude: profileData?.location?.latitude || 0, 
        longitude: profileData?.location?.longitude || 0,
        availability_type: 'part_time', // Defaulting as per original schema
      };
      await SitterService.updateLocation(dataToSave);
      onSave(dataToSave);
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
          <CardTitle className="text-brand-charcoal">Location & Availability</CardTitle>
          <CardDescription>Where will you be offering services, and when are you available?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="country" label="Country" register={register} error={errors.country} />
            <Field name="city" label="City" register={register} error={errors.city} placeholder="e.g., San Francisco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service_radius_km" className="text-brand-charcoal">Service Radius: {radius} km</Label>
            <Input id="service_radius_km" type="range" min="1" max="100" {...register('service_radius_km')} />
            {errors.service_radius_km && <p className="text-sm text-red-600">{errors.service_radius_km.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-brand-charcoal">Available Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {weekDays.map(day => (
                <Checkbox key={day} name="available_days" value={day} label={day.charAt(0).toUpperCase() + day.slice(1)} register={register} />
              ))}
            </div>
            {errors.available_days && <p className="text-sm text-red-600 mt-2">{errors.available_days.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-green hover:bg-opacity-90 text-white">
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default LocationForm;
