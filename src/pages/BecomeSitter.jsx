import { useState, useMemo, useEffect } from 'react';
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

// --- Schemas based on OpenAPI spec ---
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine(val => new Date(val).toString() !== 'Invalid Date' && new Date().getFullYear() - new Date(val).getFullYear() >= 18, "You must be at least 18."),
  profile_photo: z.instanceof(File).optional(),
  emergency_contact_name: z.string().min(2, "Emergency contact is required"),
  emergency_contact_phone: z.string().min(10, "A valid phone number is required"),
});

const locationSchema = z.object({
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  latitude: z.number(),
  longitude: z.number(),
  service_radius_km: z.coerce.number().min(1).max(50),
  availability_type: z.enum(['full_time', 'part_time']),
  available_days: z.array(z.string()).min(1, "Select at least one available day"),
});

const servicesSchema = z.object({
  boarding: z.boolean().optional(),
  walking: z.boolean().optional(),
}).refine(data => data.boarding || data.walking, "Please select at least one service.");

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0),
  pet_experience_types: z.array(z.string()).min(1, "Select at least one pet type"),
  size_experience: z.array(z.string()).min(1, "Select at least one size"),
  puppy_experience: z.boolean().optional(),
  senior_pet_experience: z.boolean().optional(),
  medication_experience: z.boolean().optional(),
  behavioral_experience: z.array(z.string()).optional(),
  first_aid_certified: z.boolean().optional(),
});

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo", "farm"]),
  home_ownership: z.enum(["own", "rent"]),
  fenced_yard: z.boolean(),
  yard_size: z.enum(["none", "small", "medium", "large"]),
  pets_in_home: z.boolean(),
  own_pets_details: z.record(z.any()).optional(),
  children_in_home: z.boolean(),
  smoking_home: z.boolean(),
  crate_available: z.boolean(),
  cameras_in_home: z.boolean(),
});

const contentSchema = z.object({
  headline: z.string().min(10).max(120),
  bio: z.string().min(50),
});

const pricingSchema = z.object({
  additional_pet_price: z.coerce.number().min(0),
  puppy_rate: z.coerce.number().min(0),
  holiday_rate: z.coerce.number().min(0),
  long_stay_discount: z.coerce.number().min(0).max(100),
  cancellation_policy: z.enum(["flexible", "moderate", "strict"]),
  payout_method: z.enum(["bank_transfer", "paypal", "stripe"]),
});

// --- Step Components ---

const StepWrapper = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
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
    <label className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
      <input type="checkbox" {...register(name)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
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
      <Field name="location.country" label="Country" />
      <Field name="location.city" label="City" />
      <Label>Service Radius: {radius} km</Label>
      <Input type="range" min="1" max="50" {...register('location.service_radius_km')} />
      <Label>Availability</Label>
      <div className="grid grid-cols-4 gap-2">
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
          <Checkbox key={day} name="location.available_days" label={day.charAt(0).toUpperCase() + day.slice(1)} />
        ))}
      </div>
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
        <option value="farm">Farm</option>
      </select>
      <Checkbox name="home.fenced_yard" label="I have a fenced yard" />
      <Checkbox name="home.pets_in_home" label="I have other pets" />
      <Checkbox name="home.children_in_home" label="I have children" />
      <Checkbox name="home.smoking_home" label="Smoking is allowed in my home" />
      <Checkbox name="home.crate_available" label="I have a crate available" />
      <Checkbox name="home.cameras_in_home" label="I have cameras in my home" />
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
    <Field name="pricing.additional_pet_price" label="Additional Pet Price" type="number" />
    <Field name="pricing.puppy_rate" label="Puppy Rate" type="number" />
    <Field name="pricing.holiday_rate" label="Holiday Rate" type="number" />
    <Field name="pricing.long_stay_discount" label="Long Stay Discount (%)" type="number" />
    <Label>Cancellation Policy</Label>
    <select {...useFormContext().register('pricing.cancellation_policy')} className="w-full p-2 border rounded">
      <option value="flexible">Flexible</option>
      <option value="moderate">Moderate</option>
      <option value="strict">Strict</option>
    </select>
    <Label>Payout Method</Label>
    <select {...useFormContext().register('pricing.payout_method')} className="w-full p-2 border rounded">
      <option value="bank_transfer">Bank Transfer</option>
      <option value="paypal">PayPal</option>
      <option value="stripe">Stripe</option>
    </select>
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
  const { user } = useAuth();

  const methods = useForm({
    mode: 'onBlur',
    defaultValues: {
      personal_info: { full_name: user?.full_name || '', date_of_birth: '', emergency_contact_name: '', emergency_contact_phone: '' },
      location: { country: 'USA', city: '', latitude: 40.7128, longitude: -74.0060, service_radius_km: 10, availability_type: 'part_time', available_days: [] },
      services: { boarding: false, walking: false },
      experience: { years_of_experience: 0, pet_experience_types: [], size_experience: [], first_aid_certified: false },
      home: { home_type: 'house', home_ownership: 'own', fenced_yard: false, yard_size: 'none', pets_in_home: false, children_in_home: false, smoking_home: false, crate_available: false, cameras_in_home: false },
      content: { headline: '', bio: '' },
      pricing: { additional_pet_price: 10, puppy_rate: 10, holiday_rate: 15, long_stay_discount: 5, cancellation_policy: 'flexible', payout_method: 'bank_transfer' },
    }
  });
  const { formState: { isSubmitting, errors }, getValues, trigger } = methods;

  const steps = useMemo(() => [
    { id: 'personal_info', title: 'Personal Information', component: PersonalInfoStep, schema: personalInfoSchema },
    { id: 'location', title: 'Location & Availability', component: LocationStep, schema: locationSchema },
    { id: 'services', title: 'Your Services', component: ServicesStep, schema: servicesSchema },
    { id: 'experience', title: 'Experience & Skills', component: ExperienceStep, schema: experienceSchema },
    { id: 'home', title: 'Home Environment', component: HomeStep, schema: homeSchema, condition: (data) => data.services?.boarding },
    { id: 'content', title: 'Profile Content', component: ContentStep, schema: contentSchema },
    { id: 'pricing', title: 'Pricing & Payouts', component: PricingStep, schema: pricingSchema },
  ], []);

  const activeSteps = useMemo(() => steps.filter(s => !s.condition || s.condition(getValues())), [steps, getValues]);
  
  const currentStep = activeSteps[stepIndex];
  const isLastStep = stepIndex === activeSteps.length - 1;

  const handleNext = async () => {
    const result = await trigger(currentStep.id);
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
        await SitterService.updateBoardingService({ active: true, base_price: data.pricing.base_price, boarding_max_pets: 5, boarding_overnight_supervision: true, boarding_allowed_pet_types: ["dog"], boarding_daily_walks: 2, boarding_potty_break_freq: "every_2_hours", boarding_sleeping_arrangement: "in_crate", boarding_separation_policy: true });
      }
      if (data.services.walking) {
        await SitterService.updateWalkingService({ 
          active: true, walking_duration: '30_min', walking_type: 'private', walking_max_dogs: 2, 
          walking_leash_type: 'standard', walking_gps_tracking: true, walking_weather_policy: 'rain_or_shine' 
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await SitterService.getSitterProfile();
        if (profileData) {
          methods.reset(profileData); // Populate form with existing data
        }
      } catch (error) {
        console.log("No existing sitter profile found. Starting fresh.");
      }
    };
    fetchProfile();
  }, [methods]);

  if (isSubmitted) {
    return <ReviewScreen />;
  }

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-10 max-w-2xl space-y-8">
        <Progress value={((stepIndex + 1) / activeSteps.length) * 100} />
        <StepWrapper title={currentStep.title}>
          <currentStep.component />
        </StepWrapper>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0 || isSubmitting}>Back</Button>
          <Button onClick={handleNext} disabled={isSubmitting} isLoading={isSubmitting}>
            {isLastStep ? 'Submit for Review' : 'Save & Continue'}
          </Button>
        </div>
        {Object.keys(errors).length > 0 && <div className="text-red-500 text-sm">Please correct the errors before continuing.</div>}
      </div>
    </FormProvider>
  );
};

export default BecomeSitter;
