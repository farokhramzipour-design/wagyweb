import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo", "farm"]),
  fenced_yard: z.boolean().optional(),
  pets_in_home: z.boolean().optional(),
  children_in_home: z.boolean().optional(),
  smoking_home: z.boolean().optional(),
  home_ownership: z.enum(["own", "rent"]).default("own"),
  yard_size: z.enum(["none", "small", "medium", "large"]).default("none"),
  crate_available: z.boolean().optional(),
  cameras_in_home: z.boolean().optional(),
});

const SingleCheckbox = ({ name, label, register }) => (
    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
        <input type="checkbox" {...register(name)} className="h-5 w-5 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
        <span>{label}</span>
    </label>
);

const HomeForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(homeSchema),
    defaultValues: {
      home_type: 'house',
      fenced_yard: false,
      pets_in_home: false,
      children_in_home: false,
      smoking_home: false,
      home_ownership: 'own',
      yard_size: 'none',
      crate_available: false,
      cameras_in_home: false,
    }
  });

  useEffect(() => {
    if (profileData?.home) {
      reset(profileData.home);
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await SitterService.updateHome(formData);
      onSave({ home: formData });
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
          <CardTitle className="text-brand-charcoal">Your Home Environment</CardTitle>
          <CardDescription>This information is only shared with pet owners after they've booked with you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-brand-charcoal">What type of home do you live in?</Label>
            <select {...register('home_type')} className="w-full p-2 border rounded-md bg-white">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="farm">Farm</option>
            </select>
          </div>
          <div className="space-y-3">
            <Label className="text-brand-charcoal">Tell us more about your home</Label>
            <SingleCheckbox name="fenced_yard" label="I have a fenced yard" register={register} />
            <SingleCheckbox name="pets_in_home" label="Other pets live in my home" register={register} />
            <SingleCheckbox name="children_in_home" label="Children live in my home" register={register} />
            <SingleCheckbox name="smoking_home" label="My home is a smoking environment" register={register} />
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

export default HomeForm;
