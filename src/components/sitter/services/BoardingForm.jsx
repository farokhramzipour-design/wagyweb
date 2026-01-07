import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox'; // Assuming a generic Checkbox component exists

const boardingSchema = z.object({
  is_boarding_supported: z.boolean().default(true),
  base_price: z.coerce.number().min(1, "Base price must be at least 1."),
  boarding_max_pets: z.coerce.number().int().min(1, "Must allow at least one pet."),
  boarding_overnight_supervision: z.boolean(),
  boarding_allowed_pet_types: z.array(z.string()).min(1, "Select at least one pet type."),
  boarding_daily_walks: z.coerce.number().int().min(0, "Cannot be negative."),
  boarding_potty_break_freq: z.enum(["every_hour", "every_2_hours", "every_4_hours", "every_8_hours"]),
  boarding_sleeping_arrangement: z.enum(["in_bed", "in_crate", "in_own_bed", "anywhere"]),
  boarding_separation_policy: z.boolean(),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600 mt-1">{error.message}</p>}
    </div>
);

const BoardingForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(boardingSchema),
    defaultValues: {
      is_boarding_supported: true,
      base_price: profileData?.base_price || 25,
      boarding_max_pets: profileData?.boarding_max_pets || 1,
      boarding_overnight_supervision: profileData?.boarding_overnight_supervision || false,
      boarding_allowed_pet_types: profileData?.boarding_allowed_pet_types || [],
      boarding_daily_walks: profileData?.boarding_daily_walks || 2,
      boarding_potty_break_freq: profileData?.boarding_potty_break_freq || 'every_4_hours',
      boarding_sleeping_arrangement: profileData?.boarding_sleeping_arrangement || 'anywhere',
      boarding_separation_policy: profileData?.boarding_separation_policy || false,
    },
  });

  useEffect(() => {
    if (profileData) {
      reset({
        is_boarding_supported: true,
        base_price: profileData.base_price || 25,
        boarding_max_pets: profileData.boarding_max_pets || 1,
        boarding_overnight_supervision: profileData.boarding_overnight_supervision || false,
        boarding_allowed_pet_types: profileData.boarding_allowed_pet_types || [],
        boarding_daily_walks: profileData.boarding_daily_walks || 2,
        boarding_potty_break_freq: profileData.boarding_potty_break_freq || 'every_4_hours',
        boarding_sleeping_arrangement: profileData.boarding_sleeping_arrangement || 'anywhere',
        boarding_separation_policy: profileData.boarding_separation_policy || false,
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await SitterService.updateBoardingService(formData);
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
          <CardTitle>Boarding Service Details</CardTitle>
          <CardDescription>Set your preferences for pets staying overnight in your home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="base_price" label="Base Price per Night ($)" type="number" register={register} error={errors.base_price} />
            <Field name="boarding_max_pets" label="Maximum Pets Allowed" type="number" register={register} error={errors.boarding_max_pets} />
            <Field name="boarding_daily_walks" label="Daily Walks Included" type="number" register={register} error={errors.boarding_daily_walks} />
          </div>
          
          <div className="space-y-2">
            <Label>Potty Break Frequency</Label>
            <select {...register('boarding_potty_break_freq')} className="w-full p-2 border rounded-md bg-white">
              <option value="every_hour">Every Hour</option>
              <option value="every_2_hours">Every 2 Hours</option>
              <option value="every_4_hours">Every 4 Hours</option>
              <option value="every_8_hours">Every 8 Hours</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Sleeping Arrangement</Label>
            <select {...register('boarding_sleeping_arrangement')} className="w-full p-2 border rounded-md bg-white">
              <option value="in_bed">In my bed</option>
              <option value="in_crate">In a crate</option>
              <option value="in_own_bed">In their own bed</option>
              <option value="anywhere">Anywhere they're comfortable</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Allowed Pet Types</Label>
            <div className="flex gap-4">
              {['dog', 'cat', 'rabbit', 'bird'].map(pet => (
                <label key={pet} className="flex items-center gap-2">
                  <Checkbox {...register('boarding_allowed_pet_types')} value={pet} />
                  {pet.charAt(0).toUpperCase() + pet.slice(1)}
                </label>
              ))}
            </div>
            {errors.boarding_allowed_pet_types && <p className="text-sm text-red-600 mt-1">{errors.boarding_allowed_pet_types.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox {...register('boarding_overnight_supervision')} />
              Overnight Supervision
            </label>
            <label className="flex items-center gap-2">
              <Checkbox {...register('boarding_separation_policy')} />
              I can separate pets if needed
            </label>
          </div>

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

export default BoardingForm;
