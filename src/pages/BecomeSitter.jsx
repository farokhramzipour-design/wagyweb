import { useState, useMemo } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import * as SitterService from '@/services/sitterService';

// --- Schemas ---
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date' && new Date().getFullYear() - new Date(val).getFullYear() >= 18, "You must be at least 18."),
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
}).refine(data => data.boarding || data.walking, "Please select at least one service.");

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0, "Years of experience cannot be negative."),
  first_aid_certified: z.boolean().optional(),
});

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo"]),
  fenced_yard: z.boolean().optional(),
});

const contentSchema = z.object({
  headline: z.string().min(10, "Headline is too short.").max(120),
  bio: z.string().min(50, "Bio is too short."),
});

const pricingSchema = z.object({
  base_price: z.coerce.number().min(1, "Base price is required."),
  holiday_rate: z.coerce.number().min(0, "Holiday rate cannot be negative."),
});

const masterSchema = z.object({
  personal_info: personalInfoSchema,
  location: locationSchema,
  services: servicesSchema,
  experience: experienceSchema,
  home: homeSchema.optional(),
  content: contentSchema,
  pricing: pricingSchema,
});

// --- Step Components ---

const StepWrapper = ({ title, children, onNext, onBack, isFirst, isLast, isSubmitting }) => (
  <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent>{children}</CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="ghost" onClick={onBack} disabled={isFirst || isSubmitting}>Back</Button>
      <Button onClick={onNext} disabled={isSubmitting} isLoading={isSubmitting}>
        {isLast ? 'Submit for Review' : 'Save & Continue'}
      </Button>
    </CardFooter>
  </Card>
);

const Field = ({ name, label, type = 'text', placeholder, error }) => {
  const { register } = useFormContext();
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...register(name)} placeholder={placeholder} />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

const Checkbox = ({ name, label }) => {
  const { register } = useFormContext();
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" {...register(name)} />
      <span>{label}</span>
    </label>
  );
};

const PersonalInfoStep = () => {
  const { formState: { errors } } = useFormContext();
  return (
    <div className="space-y-4">
      <Field name="personal_info.full_name" label="Full Name" error={errors.personal_info?.full_name} />
      <Field name="personal_info.date_of_birth" label="Date of Birth" type="date" error={errors.personal_info?.date_of_birth} />
      <Field name="personal_info.emergency_contact_name" label="Emergency Contact Name" error={errors.personal_info?.emergency_contact_name} />
      <Field name="personal_info.emergency_contact_phone" label="Emergency Contact Phone" error={errors.personal_info?.emergency_contact_phone} />
    </div>
  );
};

const LocationStep = () => {
  const { register, watch } = useFormContext();
  const radius = watch('location.service_radius_km', 10);
  return (
    <div className="space-y-4">
      <Field name="location.address" label="Your General Address" />
      <Label>Service Radius: {radius} km</Label>
      <Input type="range" min="1" max="50" {...register('location.service_radius_km')} />
    </div>
  );
};

const ServicesStep = () => {
  const { formState: { errors } } = useFormContext();
  return (
    <div className="space-y-2">
      <Checkbox name="services.boarding" label="Boarding (in your home)" />
      <Checkbox name="services.walking" label="Dog Walking" />
      {errors.services && <p className="text-red-500 text-sm">{errors.services.message}</p>}
    </div>
  );
};

const ExperienceStep = () => (
  <div className="space-y-4">
    <Field name="experience.years_of_experience" label="Years of Experience" type="number" />
    <Checkbox name="experience.first_aid_certified" label="I am First-Aid Certified" />
  </div>
);

const HomeStep = () => {
  const { register } = useFormContext();
  return (
    <div className="space-y-4">
      <Label>Home Type</Label>
      <select {...register('home.home_type')} className="w-full p-2 border rounded">
        <option value="house">House</option>
        <option value="apartment">Apartment</option>
        <option value="condo">Condo</option>
      </select>
      <Checkbox name="home.fenced_yard" label="I have a fenced yard" />
    </div>
  );
};

const ContentStep = () => (
  <div className="space-y-4">
    <Field name="content.headline" label="Profile Headline" />
    <Label>About You</Label>
    <textarea {...useFormContext().register('content.bio')} className="w-full p-2 border rounded" rows="4" />
  </div>
);

const PricingStep = () => (
  <div className="space-y-4">
    <Field name="pricing.base_price" label="Base Price (per service)" type="number" />
    <Field name="pricing.holiday_rate" label="Holiday Rate (e.g., 1.5x)" type="number" />
  </div>
);

const ReviewScreen = () => (
  <Card>
    <CardHeader>
      <CardTitle>🎉 Application Submitted!</CardTitle>
      <CardDescription>Your profile is now under review. We'll get back to you shortly.</CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
    </CardContent>
  </Card>
);

// --- Main Component ---
const BecomeSitter = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const methods = useForm({
    resolver: zodResolver(masterSchema),
    mode: 'onBlur',
    defaultValues: {
      personal_info: { full_name: '', date_of_birth: '', emergency_contact_name: '', emergency_contact_phone: '' },
      location: { address: '', service_radius_km: 10 },
      services: { boarding: false, walking: false },
      experience: { years_of_experience: 0, first_aid_certified: false },
      home: { home_type: 'house', fenced_yard: false },
      content: { headline: '', bio: '' },
      pricing: { base_price: 25, holiday_rate: 35 },
    }
  });
  const { formState: { isSubmitting }, getValues } = methods;

  const steps = useMemo(() => [
    { id: 'personal_info', title: 'Personal Information', component: PersonalInfoStep },
    { id: 'location', title: 'Location', component: LocationStep },
    { id: 'services', title: 'Services', component: ServicesStep },
    { id: 'experience', title: 'Your Experience', component: ExperienceStep },
    { id: 'home', title: 'Home Environment', component: HomeStep, condition: (data) => data.services?.boarding },
    { id: 'content', title: 'Profile Content', component: ContentStep },
    { id: 'pricing', title: 'Pricing', component: PricingStep },
  ], []);

  const activeSteps = useMemo(() => steps.filter(s => !s.condition || s.condition(getValues())), [steps, getValues]);
  
  const currentStep = activeSteps[stepIndex];
  const isLastStep = stepIndex === activeSteps.length - 1;

  const handleNext = async () => {
    const result = await methods.trigger();
    if (result) {
      if (isLastStep) {
        await methods.handleSubmit(onSubmit)();
      } else {
        setStepIndex(i => i + 1);
      }
    }
  };

  const handleBack = () => setStepIndex(i => i - 1);

  const onSubmit = async (data) => {
    try {
      await SitterService.updatePersonalInfo(data.personal_info);
      await SitterService.updateLocation(data.location);
      
      if (data.services.boarding) {
        await SitterService.updateBoardingService({ active: true, max_pets_at_once: 5, overnight_supervision: true });
      }
      if (data.services.walking) {
        await SitterService.updateWalkingService({ 
          active: true, walking_duration: '30', walking_type: 'solo', walking_max_dogs: 2, 
          walking_leash_type: 'standard', walking_gps_tracking: true, walking_weather_policy: 'flexible' 
        });
      }

      await SitterService.updateExperience(data.experience);
      if (data.services.boarding) {
        await SitterService.updateHome(data.home);
      }
      await SitterService.updateContent(data.content);
      await SitterService.updatePricing(data.pricing);
      
      await SitterService.submitForReview();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Full submission failed:", error);
      alert("Submission failed. Please check the console for details.");
    }
  };

  if (isSubmitted) {
    return <ReviewScreen />;
  }

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-10 max-w-2xl space-y-8">
        <Progress value={((stepIndex + 1) / activeSteps.length) * 100} />
        <StepWrapper
          title={currentStep.title}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={stepIndex === 0}
          isLast={isLastStep}
          isSubmitting={isSubmitting}
        >
          <currentStep.component />
        </StepWrapper>
      </div>
    </FormProvider>
  );
};

export default BecomeSitter;
