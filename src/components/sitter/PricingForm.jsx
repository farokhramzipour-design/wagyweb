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

const pricingSchema = z.object({
  base_price: z.coerce.number().min(1, "Base price is required."),
  additional_pet_price: z.coerce.number().min(0, "Cannot be negative."),
  puppy_rate: z.coerce.number().min(0, "Cannot be negative."),
  holiday_rate: z.coerce.number().min(0, "Cannot be negative."),
  long_stay_discount: z.coerce.number().min(0).max(100, "Discount must be between 0 and 100."),
  cancellation_policy: z.enum(["flexible", "moderate", "strict"]),
  payout_method: z.enum(["bank_transfer", "paypal", "stripe"]),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const PricingForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      base_price: 25,
      additional_pet_price: 10,
      puppy_rate: 10,
      holiday_rate: 15,
      long_stay_discount: 5,
      cancellation_policy: 'flexible',
      payout_method: 'bank_transfer',
    }
  });

  useEffect(() => {
    if (profileData) {
      reset({
        base_price: profileData.base_price || 25,
        additional_pet_price: profileData.additional_pet_price || 10,
        puppy_rate: profileData.puppy_rate || 10,
        holiday_rate: profileData.holiday_rate || 15,
        long_stay_discount: profileData.long_stay_discount || 5,
        cancellation_policy: profileData.cancellation_policy || 'flexible',
        payout_method: profileData.payout_method || 'bank_transfer',
      });
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await SitterService.updatePricing(formData);
      onSave(formData);
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
          <CardTitle className="text-brand-charcoal">Pricing & Payouts</CardTitle>
          <CardDescription>Set your rates and how you'd like to receive payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="base_price" label="Base Price (per night)" type="number" register={register} error={errors.base_price} />
            <Field name="additional_pet_price" label="Additional Pet Rate" type="number" register={register} error={errors.additional_pet_price} />
            <Field name="puppy_rate" label="Puppy Rate (extra)" type="number" register={register} error={errors.puppy_rate} />
            <Field name="holiday_rate" label="Holiday Rate (extra)" type="number" register={register} error={errors.holiday_rate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="long_stay_discount">Long Stay Discount (%)</Label>
            <Input id="long_stay_discount" type="number" min="0" max="100" {...register('long_stay_discount')} />
            {errors.long_stay_discount && <p className="text-sm text-red-600 mt-1">{errors.long_stay_discount.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cancellation Policy</Label>
              <select {...register('cancellation_policy')} className="w-full p-2 border rounded-md bg-white">
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Payout Method</Label>
              <select {...register('payout_method')} className="w-full p-2 border rounded-md bg-white">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-green hover:bg-opacity-90 text-white">
            {isSubmitting ? 'Saving...' : 'Finish & Submit for Review'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default PricingForm;
