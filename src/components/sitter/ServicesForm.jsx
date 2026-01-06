import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { Home, Dog, Key, Eye, Sun } from 'lucide-react';

const servicesSchema = z.object({
  boarding: z.boolean().optional(),
  house_sitting: z.boolean().optional(),
  drop_in: z.boolean().optional(),
  dog_walking: z.boolean().optional(),
  day_care: z.boolean().optional(),
}).refine(data => Object.values(data).some(Boolean), {
  message: "Please select at least one service to offer.",
  path: ["services"],
});

const ServiceCheckbox = ({ name, register, icon, title, description }) => (
  <label className="flex items-start gap-4 p-4 border rounded-lg cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
    <input type="checkbox" {...register(name)} className="opacity-0 absolute h-0 w-0" />
    <div className="mt-1">{icon}</div>
    <div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  </label>
);

const ServicesForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      boarding: false,
      house_sitting: false,
      drop_in: false,
      dog_walking: false,
      day_care: false,
    }
  });

  useEffect(() => {
    if (profileData) {
      reset({
        boarding: profileData.is_boarding_supported || false,
        house_sitting: profileData.is_house_sitting_supported || false,
        drop_in: profileData.is_drop_in_supported || false,
        dog_walking: profileData.is_dog_walking_supported || false,
        day_care: profileData.is_day_care_supported || false,
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const promises = [];

      if (formData.boarding) {
        promises.push(SitterService.updateBoardingService({ is_boarding_supported: true, ...profileData.boarding }));
      }
      if (formData.house_sitting) {
        promises.push(SitterService.updateHouseSittingService({ is_house_sitting_supported: true, ...profileData.house_sitting }));
      }
      if (formData.drop_in) {
        promises.push(SitterService.updateDropInService({ is_drop_in_supported: true, ...profileData.drop_in }));
      }
      if (formData.dog_walking) {
        promises.push(SitterService.updateWalkingService({ is_dog_walking_supported: true, ...profileData.dog_walking }));
      }
      if (formData.day_care) {
        promises.push(SitterService.updateDayCareService({ is_day_care_supported: true, ...profileData.day_care }));
      }

      const responses = await Promise.all(promises);
      const updatedProfile = responses.reduce((acc, res) => ({ ...acc, ...res.data }), profileData);
      
      onSave(updatedProfile);

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
          <CardTitle>Your Services</CardTitle>
          <CardDescription>What services will you offer? You can change this at any time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ServiceCheckbox name="boarding" register={register} icon={<Home className="w-8 h-8" />} title="Boarding" description="Care for pets overnight in your home." />
          <ServiceCheckbox name="house_sitting" register={register} icon={<Key className="w-8 h-8" />} title="House Sitting" description="Stay with pets in their own home." />
          <ServiceCheckbox name="drop_in" register={register} icon={<Eye className="w-8 h-8" />} title="Drop-In Visits" description="Stop by for check-ins and playtime." />
          <ServiceCheckbox name="dog_walking" register={register} icon={<Dog className="w-8 h-8" />} title="Dog Walking" description="Provide neighborhood walks for local dogs." />
          <ServiceCheckbox name="day_care" register={register} icon={<Sun className="w-8 h-8" />} title="Doggy Day Care" description="Host pets in your home during the day." />
          {errors.services && <p className="text-sm text-red-600 mt-2">{errors.services.message}</p>}
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ServicesForm;
