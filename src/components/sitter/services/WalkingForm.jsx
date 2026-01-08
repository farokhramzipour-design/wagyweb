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
import { Checkbox } from '@/components/ui/Checkbox';

const walkingSchema = z.object({
  is_dog_walking_supported: z.boolean().default(true),
  walking_duration: z.enum(["30_min", "60_min"]),
  walking_type: z.enum(["private", "group"]),
  walking_max_dogs: z.coerce.number().int().min(1, "Must allow at least one dog."),
  walking_leash_type: z.enum(["standard", "retractable", "long_line"]),
  walking_gps_tracking: z.boolean(),
  walking_weather_policy: z.enum(["rain_or_shine", "no_extreme_weather"]),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600 mt-1">{error.message}</p>}
    </div>
);

const WalkingForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(walkingSchema),
    defaultValues: {
      is_dog_walking_supported: true,
      walking_duration: '30_min',
      walking_type: 'private',
      walking_max_dogs: 1,
      walking_leash_type: 'standard',
      walking_gps_tracking: false,
      walking_weather_policy: 'rain_or_shine',
    },
  });

  useEffect(() => {
    if (profileData) {
      reset({
        is_dog_walking_supported: true,
        walking_duration: profileData.walking_duration || '30_min',
        walking_type: profileData.walking_type || 'private',
        walking_max_dogs: profileData.walking_max_dogs || 1,
        walking_leash_type: profileData.walking_leash_type || 'standard',
        walking_gps_tracking: profileData.walking_gps_tracking || false,
        walking_weather_policy: profileData.walking_weather_policy || 'rain_or_shine',
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await SitterService.updateWalkingService(formData);
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
          <CardTitle>Dog Walking Service Details</CardTitle>
          <CardDescription>Set your preferences for dog walking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Walk Duration</Label>
              <select {...register('walking_duration')} className="w-full p-2 border rounded-md bg-white">
                <option value="30_min">30 Minutes</option>
                <option value="60_min">60 Minutes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Walk Type</Label>
              <select {...register('walking_type')} className="w-full p-2 border rounded-md bg-white">
                <option value="private">Private</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>

          <Field name="walking_max_dogs" label="Maximum Dogs per Walk" type="number" register={register} error={errors.walking_max_dogs} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Leash Type</Label>
              <select {...register('walking_leash_type')} className="w-full p-2 border rounded-md bg-white">
                <option value="standard">Standard</option>
                <option value="retractable">Retractable</option>
                <option value="long_line">Long Line</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Weather Policy</Label>
              <select {...register('walking_weather_policy')} className="w-full p-2 border rounded-md bg-white">
                <option value="rain_or_shine">Rain or Shine</option>
                <option value="no_extreme_weather">No Extreme Weather</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox {...register('walking_gps_tracking')} />
              GPS Tracking Offered
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

export default WalkingForm;
