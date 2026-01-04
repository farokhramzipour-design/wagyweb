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

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0, "Years of experience cannot be negative."),
  pet_experience_types: z.array(z.string()).min(1, "Please select at least one pet type."),
  size_experience: z.array(z.string()).min(1, "Please select at least one pet size you're comfortable with."),
  first_aid_certified: z.boolean().optional(),
  // Adding other optional fields for future use, with defaults.
  puppy_experience: z.boolean().optional(),
  senior_pet_experience: z.boolean().optional(),
  medication_experience: z.boolean().optional(),
});

const Checkbox = ({ name, value, label, register }) => (
    <label className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
        <input type="checkbox" {...register(name)} value={value} className="opacity-0 absolute h-0 w-0" />
        <span>{label}</span>
    </label>
);

const SingleCheckbox = ({ name, label, register }) => (
    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
        <input type="checkbox" {...register(name)} className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
        <span>{label}</span>
    </label>
);

const ExperienceForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      years_of_experience: 0,
      pet_experience_types: [],
      size_experience: [],
      first_aid_certified: false,
      puppy_experience: false,
      senior_pet_experience: false,
      medication_experience: false,
    }
  });

  useEffect(() => {
    if (profileData?.experience) {
      reset(profileData.experience);
    }
  }, [profileData, reset]);

  const petTypes = ['dog', 'cat', 'rabbit', 'bird'];
  const petSizes = ['small', 'medium', 'large', 'giant'];

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await SitterService.updateExperience(formData);
      onSave({ experience: formData });
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
          <CardTitle className="text-brand-charcoal">Experience & Skills</CardTitle>
          <CardDescription>Tell pet owners why you're a great choice. Highlight your experience and any special skills you have.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="years_of_experience" className="text-brand-charcoal">Years of Pet Care Experience</Label>
            <Input id="years_of_experience" type="number" min="0" {...register('years_of_experience')} className="mt-2 max-w-xs" />
            {errors.years_of_experience && <p className="text-sm text-red-600 mt-1">{errors.years_of_experience.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-brand-charcoal">Pets You Have Experience With</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {petTypes.map(type => <Checkbox key={type} name="pet_experience_types" value={type} label={type.charAt(0).toUpperCase() + type.slice(1)} register={register} />)}
            </div>
            {errors.pet_experience_types && <p className="text-sm text-red-600 mt-2">{errors.pet_experience_types.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-brand-charcoal">Pet Sizes You're Comfortable With</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {petSizes.map(size => <Checkbox key={size} name="size_experience" value={size} label={size.charAt(0).toUpperCase() + size.slice(1)} register={register} />)}
            </div>
            {errors.size_experience && <p className="text-sm text-red-600 mt-2">{errors.size_experience.message}</p>}
          </div>
          <div className="space-y-3">
            <Label className="text-brand-charcoal">Special Skills & Certifications</Label>
            <SingleCheckbox name="first_aid_certified" label="I am certified in pet first aid & CPR" register={register} />
            <SingleCheckbox name="puppy_experience" label="I have experience with puppies" register={register} />
            <SingleCheckbox name="senior_pet_experience" label="I have experience with senior pets" register={register} />
            <SingleCheckbox name="medication_experience" label="I can administer medication" register={register} />
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

export default ExperienceForm;
