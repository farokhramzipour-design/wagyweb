import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import * as SitterService from '@/services/sitterService';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { Home, Dog } from 'lucide-react';

// Schema to ensure at least one service is selected
const servicesSchema = z.object({
  boarding: z.boolean().optional(),
  walking: z.boolean().optional(),
}).refine(data => data.boarding || data.walking, {
  message: "Please select at least one service to offer.",
  path: ["services"], // Assign error to a custom path
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

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      boarding: profileData?.services?.boarding?.active || false,
      walking: profileData?.services?.walking?.active || false,
    }
  });

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // We call the update services endpoint for each selected service
      if (formData.boarding) {
        await SitterService.updateBoardingService({ active: true });
      }
      if (formData.walking) {
        await SitterService.updateWalkingService({ active: true });
      }
      
      // We need to structure the saved data to match the profile object
      const savedData = {
        services: {
          boarding: { active: formData.boarding },
          walking: { active: formData.walking }
        }
      };
      onSave(savedData);

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
          <CardTitle className="text-brand-charcoal">Your Services</CardTitle>
          <CardDescription>What services will you offer? You can change this at any time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ServiceCheckbox
            name="boarding"
            register={register}
            icon={<Home className="w-8 h-8" />}
            title="Boarding"
            description="Care for pets overnight in your home. You'll get the most bookings with this service."
          />
          <ServiceCheckbox
            name="walking"
            register={register}
            icon={<Dog className="w-8 h-8" />}
            title="Dog Walking"
            description="Provide neighborhood walks for local dogs. A great way to get started."
          />
          {errors.services && <p className="text-sm text-red-600 mt-2">{errors.services.message}</p>}
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

export default ServicesForm;
