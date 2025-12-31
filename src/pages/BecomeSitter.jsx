import { useState, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import * as SitterService from '@/services/sitterService';
import { useAuth } from '@/hooks/useAuth';

// --- Schemas ---
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine(val => new Date().getFullYear() - new Date(val).getFullYear() >= 18, "You must be at least 18"),
  profile_photo: z.instanceof(File).optional(), // Making optional for now
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(10, "Valid phone number is required"),
});

const locationSchema = z.object({
  address: z.string().min(5, "A valid address is required"),
  service_radius_km: z.coerce.number().min(1).max(50),
});

const servicesSchema = z.object({
  boarding: z.boolean().optional(),
  walking: z.boolean().optional(),
}).refine(data => Object.values(data).some(v => v), "Select at least one service.");

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0),
  first_aid_certified: z.boolean().optional(),
});

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo"]),
  fenced_yard: z.boolean().optional(),
});

const contentSchema = z.object({
  headline: z.string().min(10).max(120),
  bio: z.string().min(50),
});

const pricingSchema = z.object({
  base_price: z.coerce.number().min(1),
  holiday_rate: z.coerce.number().min(0),
});

// --- Step Components ---

const StepCard = ({ title, children, onNext, onBack, isFirst, isLast }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
    <CardFooter className="flex justify-between">
      {!isFirst && <Button variant="ghost" onClick={onBack}>Back</Button>}
      <Button onClick={onNext}>{isLast ? 'Submit for Review' : 'Save & Continue'}</Button>
    </CardFooter>
  </Card>
);

const PersonalInfoStep = () => {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-4">
      <Input {...register('personal_info.full_name')} placeholder="Full Name" />
      {errors.personal_info?.full_name && <p className="text-red-500 text-sm">{errors.personal_info.full_name.message}</p>}
      <Input type="date" {...register('personal_info.date_of_birth')} />
      {errors.personal_info?.date_of_birth && <p className="text-red-500 text-sm">{errors.personal_info.date_of_birth.message}</p>}
      <Input {...register('personal_info.emergency_contact_name')} placeholder="Emergency Contact Name" />
      <Input {...register('personal_info.emergency_contact_phone')} placeholder="Emergency Contact Phone" />
    </div>
  );
};

const LocationStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <Input {...register('location.address')} placeholder="Your Address" />
      <Input type="range" min="1" max="50" {...register('location.service_radius_km')} />
    </div>
  );
};

const ServicesStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-2">
      <label><input type="checkbox" {...register('services.boarding')} /> Boarding</label>
      <label><input type="checkbox" {...register('services.walking')} /> Dog Walking</label>
    </div>
  );
};

const ExperienceStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <Input type="number" {...register('experience.years_of_experience')} placeholder="Years of Experience" />
      <label><input type="checkbox" {...register('experience.first_aid_certified')} /> First Aid Certified</label>
    </div>
  );
};

const HomeStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <select {...register('home.home_type')}>
        <option value="house">House</option>
        <option value="apartment">Apartment</option>
        <option value="condo">Condo</option>
      </select>
      <label><input type="checkbox" {...register('home.fenced_yard')} /> Fenced Yard</label>
    </div>
  );
};

const ContentStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <Input {...register('content.headline')} placeholder="Profile Headline" />
      <textarea {...register('content.bio')} placeholder="About you..." className="w-full p-2 border rounded" />
    </div>
  );
};

const PricingStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <Input type="number" {...register('pricing.base_price')} placeholder="Base Price" />
      <Input type="number" {...register('pricing.holiday_rate')} placeholder="Holiday Rate" />
    </div>
  );
};

const ReviewStep = () => (
  <div>
    <h3 className="text-xl font-bold">Application Submitted!</h3>
    <p>Your profile is now under review. We'll get back to you shortly.</p>
  </div>
);

// --- Main Component ---
const BecomeSitter = () => {
  const [step, setStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const steps = useMemo(() => [
    { id: 'personal_info', title: 'Personal Information', component: PersonalInfoStep, schema: personalInfoSchema },
    { id: 'location', title: 'Location', component: LocationStep, schema: locationSchema },
    { id: 'services', title: 'Services', component: ServicesStep, schema: servicesSchema },
    { id: 'experience', title: 'Experience', component: ExperienceStep, schema: experienceSchema },
    { id: 'home', title: 'Home Environment', component: HomeStep, schema: homeSchema },
    { id: 'content', title: 'Profile Content', component: ContentStep, schema: contentSchema },
    { id: 'pricing', title: 'Pricing', component: PricingStep, schema: pricingSchema },
  ], []);

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const methods = useForm({
    resolver: zodResolver(steps.map(s => s.schema).reduce((acc, schema) => acc.merge(schema), z.object({}))),
    mode: 'onChange',
  });

  const handleNext = async () => {
    const result = await methods.trigger(currentStep.id);
    if (result) {
      if (isLastStep) {
        await handleSubmit();
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await SitterService.updatePersonalInfo(data.personal_info);
      await SitterService.updateLocation(data.location);
      if (data.services.boarding) await SitterService.updateBoardingService({ active: true, ... });
      if (data.services.walking) await SitterService.updateWalkingService({ active: true, ... });
      await SitterService.updateExperience(data.experience);
      await SitterService.updateHome(data.home);
      await SitterService.updateContent(data.content);
      await SitterService.updatePricing(data.pricing);
      await SitterService.submitForReview();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Full submission failed:", error);
    }
  });

  if (isSubmitted) {
    return <ReviewStep />;
  }

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-10 max-w-2xl">
        <Progress value={((step + 1) / steps.length) * 100} className="mb-8" />
        <StepCard
          title={currentStep.title}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={step === 0}
          isLast={isLastStep}
        >
          <currentStep.component />
        </StepCard>
      </div>
    </FormProvider>
  );
};

export default BecomeSitter;
