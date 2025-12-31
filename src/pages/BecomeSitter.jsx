import { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

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
  profile_photo: z.instanceof(File).refine(file => file.size > 0, "Profile photo is required."),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(10, "Valid phone number is required"),
});

const locationSchema = z.object({
  address: z.string().min(5, "A valid address is required"),
  service_radius_km: z.coerce.number().min(1).max(50),
  availability: z.object({
    days: z.array(z.string()).min(1, "Select at least one day"),
    blackout_dates: z.array(z.date()).optional(),
  }),
});

const servicesSchema = z.object({
  boarding: z.boolean().optional(),
  house_sitting: z.boolean().optional(),
  drop_in_visits: z.boolean().optional(),
  walking: z.boolean().optional(),
  doggy_day_care: z.boolean().optional(),
  dog_training: z.boolean().optional(),
}).refine(data => Object.values(data).some(v => v), "Select at least one service.");

const boardingSetupSchema = z.object({
  price_per_night: z.coerce.number().min(1),
  max_pets: z.coerce.number().min(1),
  overnight_supervision: z.boolean(),
});

const walkingSetupSchema = z.object({
  walk_duration: z.enum(['30', '60', '90']),
  solo_or_group: z.enum(['solo', 'group']),
  max_dogs: z.coerce.number().min(1),
  gps_tracking_enabled: z.boolean(),
});

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0),
  pet_types: z.array(z.string()).min(1),
  first_aid_certified: z.boolean(),
  certification_proof: z.instanceof(File).optional(),
}).refine(data => !data.first_aid_certified || (data.first_aid_certified && data.certification_proof), {
  message: "Please upload proof of certification.",
  path: ["certification_proof"],
});

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo"]),
  fenced_yard: z.boolean(),
  other_pets: z.boolean(),
  children_in_home: z.boolean(),
  cameras_in_home: z.boolean(),
  smoking_home: z.boolean(),
});

const contentSchema = z.object({
  headline: z.string().min(10).max(120),
  bio: z.string().min(50),
  gallery_photos: z.array(z.instanceof(File)).max(5).optional(),
});

const verificationSchema = z.object({
  government_id: z.instanceof(File).refine(f => f.size > 0, "ID is required"),
  selfie: z.instanceof(File).refine(f => f.size > 0, "Selfie is required"),
  background_check_consent: z.boolean().refine(val => val, "You must consent to a background check."),
});

const pricingSchema = z.object({
  base_price: z.coerce.number().min(1),
  holiday_rate: z.coerce.number().min(0),
  cancellation_policy: z.enum(['flexible', 'moderate', 'strict']),
});

const payoutsSchema = z.object({
  payout_method: z.enum(['bank_transfer', 'paypal']),
  // Add fields based on method
});

const masterSchema = z.object({
  personal_info: personalInfoSchema,
  location: locationSchema,
  services: servicesSchema,
  service_configs: z.object({
    boarding: boardingSetupSchema.optional(),
    walking: walkingSetupSchema.optional(),
  }).optional(),
  experience: experienceSchema,
  home: homeSchema.optional(),
  content: contentSchema,
  verification: verificationSchema,
  pricing: pricingSchema,
  payouts: payoutsSchema,
});

// --- UI Components ---

const StepCard = ({ title, description, children, footer }) => (
  <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  </motion.div>
);

const FileInput = ({ name, label }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="file" {...register(name)} />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};

const Checkbox = ({ name, label }) => {
  const { register } = useFormContext();
  return (
    <label className="flex items-center space-x-2">
      <input type="checkbox" {...register(name)} className="rounded border-gray-300" />
      <span>{label}</span>
    </label>
  );
};

// --- Steps ---

const PersonalInfoStep = () => (
  <StepCard title="Personal Information" description="Tell us about yourself.">
    <div className="space-y-4">
      <Input {...useFormContext().register('personal_info.full_name')} placeholder="Full Name" />
      <Input type="date" {...useFormContext().register('personal_info.date_of_birth')} />
      <FileInput name="personal_info.profile_photo" label="Profile Photo" />
      <Input {...useFormContext().register('personal_info.emergency_contact_name')} placeholder="Emergency Contact Name" />
      <Input {...useFormContext().register('personal_info.emergency_contact_phone')} placeholder="Emergency Contact Phone" />
    </div>
  </StepCard>
);

const LocationStep = () => (
  <StepCard title="Location & Availability" description="Where and when can you offer services?">
    <div className="space-y-4">
      <Input {...useFormContext().register('location.address')} placeholder="Your Address" />
      <div>
        <Label>Service Radius: {useFormContext().watch('location.service_radius_km', 10)} km</Label>
        <Input type="range" min="1" max="50" {...useFormContext().register('location.service_radius_km')} />
      </div>
      <div>
        <Label>Available Days</Label>
        <div className="flex gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <Checkbox key={day} name="location.availability.days" label={day} />
          ))}
        </div>
      </div>
    </div>
  </StepCard>
);

const ServicesStep = () => {
  const { register, formState: { errors } } = useFormContext();
  const serviceList = {
    boarding: 'Boarding',
    house_sitting: 'House Sitting',
    drop_in_visits: 'Drop-In Visits',
    walking: 'Dog Walking',
    doggy_day_care: 'Doggy Day Care',
    dog_training: 'Dog Training',
  };
  return (
    <StepCard title="Choose Your Services">
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(serviceList).map(([key, name]) => (
          <Checkbox key={key} name={`services.${key}`} label={name} />
        ))}
      </div>
      {errors.services && <p className="text-sm text-red-500 mt-2">{errors.services.message}</p>}
    </StepCard>
  );
};

const ServiceConfigStep = ({ service, onDone }) => {
  const { register, formState: { errors } } = useFormContext();
  
  const renderServiceForm = () => {
    switch(service) {
      case 'boarding':
        return (
          <div className="space-y-4">
            <Input type="number" {...register('service_configs.boarding.price_per_night')} placeholder="Price per night" />
            <Input type="number" {...register('service_configs.boarding.max_pets')} placeholder="Max pets at once" />
            <Checkbox name="service_configs.boarding.overnight_supervision" label="Overnight Supervision" />
          </div>
        );
      case 'walking':
        return (
          <div className="space-y-4">
            <select {...register('service_configs.walking.walk_duration')}>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
            <Checkbox name="service_configs.walking.gps_tracking_enabled" label="GPS Tracking Enabled" />
          </div>
        );
      default:
        return <p>This service requires no extra setup.</p>;
    }
  };

  return (
    <StepCard title={`Setup: ${service}`} footer={<Button onClick={onDone}>Done</Button>}>
      {renderServiceForm()}
    </StepCard>
  );
};

const ExperienceStep = () => {
  const { register, watch } = useFormContext();
  const isCertified = watch('experience.first_aid_certified');
  return (
    <StepCard title="Experience & Skills">
      <div className="space-y-4">
        <Input type="number" {...register('experience.years_of_experience')} placeholder="Years of Experience" />
        <Checkbox name="experience.first_aid_certified" label="First Aid Certified" />
        {isCertified && <FileInput name="experience.certification_proof" label="Upload Proof" />}
      </div>
    </StepCard>
  );
};

const HomeStep = () => (
  <StepCard title="Home Environment">
    <div className="space-y-4">
      <Checkbox name="home.fenced_yard" label="Fenced Yard" />
      <Checkbox name="home.other_pets" label="Other Pets in Home" />
      <Checkbox name="home.children_in_home" label="Children in Home" />
      <Checkbox name="home.cameras_in_home" label="Cameras in Home" />
      <Checkbox name="home.smoking_home" label="Smoking in Home" />
    </div>
  </StepCard>
);

const VerificationStep = () => (
  <StepCard title="Identity & Safety">
    <div className="space-y-4">
      <FileInput name="verification.government_id" label="Government ID" />
      <FileInput name="verification.selfie" label="Live Selfie" />
      <Checkbox name="verification.background_check_consent" label="I consent to a background check." />
    </div>
  </StepCard>
);

const ContentStep = () => (
  <StepCard title="Profile Content">
    <div className="space-y-4">
      <Input {...useFormContext().register('content.headline')} placeholder="Catchy Headline" />
      <textarea {...useFormContext().register('content.bio')} placeholder="About you..." className="w-full p-2 border rounded" />
      <FileInput name="content.gallery_photos" label="Upload Photos (up to 5)" />
    </div>
  </StepCard>
);

const PricingStep = () => (
  <StepCard title="Pricing & Payouts">
    <div className="space-y-4">
      <Input type="number" {...useFormContext().register('pricing.base_price')} placeholder="Base Price" />
      <Input type="number" {...useFormContext().register('pricing.holiday_rate')} placeholder="Holiday Rate" />
      <select {...useFormContext().register('pricing.cancellation_policy')}>
        <option value="flexible">Flexible</option>
        <option value="moderate">Moderate</option>
        <option value="strict">Strict</option>
      </select>
      <select {...useFormContext().register('payouts.payout_method')}>
        <option value="bank_transfer">Bank Transfer</option>
        <option value="paypal">PayPal</option>
      </select>
    </div>
  </StepCard>
);

const ReviewStep = ({ onBack }) => {
  const { getValues } = useFormContext();
  const profile = getValues();
  return (
    <StepCard title="Review & Submit" footer={<Button onClick={onBack}>Back</Button>}>
      <div className="space-y-4">
        <h3 className="font-bold">{profile.personal_info.full_name}</h3>
        <p>{profile.content.headline}</p>
        {/* Add more preview fields */}
      </div>
    </StepCard>
  );
};

// --- Main Component ---
const BecomeSitter = () => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(null);
  const [serviceConfigQueue, setServiceConfigQueue] = useState([]);
  
  const methods = useForm({
    // resolver: zodResolver(masterSchema), // Enable for full-form validation
    defaultValues: {
      personal_info: {},
      location: { service_radius_km: 10, availability: { days: [] } },
      services: {},
      experience: {},
      home: {},
      content: {},
      verification: {},
      pricing: {},
      payouts: {},
    }
  });

  const steps = useMemo(() => [
    { id: 'personal_info', component: PersonalInfoStep, schema: personalInfoSchema },
    { id: 'location', component: LocationStep, schema: locationSchema },
    { id: 'services', component: ServicesStep, schema: servicesSchema },
    { id: 'experience', component: ExperienceStep, schema: experienceSchema },
    { id: 'home', component: HomeStep, schema: homeSchema, condition: (data) => data.services?.boarding || data.services?.doggy_day_care },
    { id: 'content', component: ContentStep, schema: contentSchema },
    { id: 'verification', component: VerificationStep, schema: verificationSchema },
    { id: 'pricing', component: PricingStep, schema: pricingSchema },
    { id: 'review', component: ReviewStep },
  ], []);

  const activeSteps = useMemo(() => steps.filter(s => !s.condition || s.condition(methods.getValues())), [steps, methods]);

  const currentStep = activeSteps[step];
  const isLastStep = step === activeSteps.length - 1;

  const handleNext = methods.handleSubmit(async (data) => {
    try {
      // Partial submission logic
      const currentSchema = currentStep.schema;
      if (currentSchema) {
        const result = currentSchema.safeParse(data[currentStep.id]);
        if (!result.success) {
          console.error("Validation failed for step:", currentStep.id, result.error.flatten());
          // Trigger UI errors
          return;
        }
      }

      if (currentStep.id === 'services') {
        const selectedServices = Object.keys(data.services).filter(k => data.services[k]);
        const servicesToConfigure = selectedServices.filter(s => ['boarding', 'walking'].includes(s));
        if (servicesToConfigure.length > 0) {
          setServiceConfigQueue(servicesToConfigure);
          return; // Enter service config flow
        }
      }

      if (isLastStep) {
        await SitterService.submitForReview();
        // Handle success
      } else {
        setStep(s => s + 1);
      }
    } catch (error) {
      console.error("Submission failed:", error);
    }
  });

  const handleBack = () => setStep(s => s - 1);

  const handleServiceConfigDone = () => {
    setServiceConfigQueue(q => q.slice(1));
    if (serviceConfigQueue.length === 1) { // Was the last one
      setStep(s => s + 1);
    }
  };

  if (serviceConfigQueue.length > 0) {
    return (
      <FormProvider {...methods}>
        <ServiceConfigStep service={serviceConfigQueue[0]} onDone={handleServiceConfigDone} />
      </FormProvider>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-10 max-w-2xl">
        <Progress value={(step / activeSteps.length) * 100} className="mb-8" />
        <AnimatePresence mode="wait">
          {currentStep && <currentStep.component />}
        </AnimatePresence>
        <div className="flex gap-4 mt-8">
          {step > 0 && <Button variant="ghost" onClick={handleBack}>Back</Button>}
          <Button onClick={handleNext} isLoading={methods.formState.isSubmitting}>
            {isLastStep ? 'Submit for Review' : 'Save & Continue'}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};

export default BecomeSitter;
