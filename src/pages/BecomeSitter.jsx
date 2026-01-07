import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import * as SitterService from '@/services/sitterService';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

// Lazy load the form components
const PersonalInfoForm = lazy(() => import('@/components/sitter/PersonalInfoForm'));
const LocationForm = lazy(() => import('@/components/sitter/LocationForm'));
const ServicesForm = lazy(() => import('@/components/sitter/ServicesForm'));
const BoardingForm = lazy(() => import('@/components/sitter/services/BoardingForm'));
const WalkingForm = lazy(() => import('@/components/sitter/services/WalkingForm'));
const HouseSittingForm = lazy(() => import('@/components/sitter/services/HouseSittingForm'));
const DropInForm = lazy(() => import('@/components/sitter/services/DropInForm'));
const DayCareForm = lazy(() => import('@/components/sitter/services/DayCareForm'));
const ExperienceForm = lazy(() => import('@/components/sitter/ExperienceForm'));
const HomeForm = lazy(() => import('@/components/sitter/HomeForm'));
const ContentForm = lazy(() => import('@/components/sitter/ContentForm'));
const PricingForm = lazy(() => import('@/components/sitter/PricingForm'));

const StepLoading = () => (
  <div className="flex justify-center items-center h-96">
    <p className="text-brand-charcoal">Loading your profile...</p>
  </div>
);

const ReviewScreen = () => (
  <Card className="text-center">
    <CardHeader>
      <CardTitle className="text-brand-green text-2xl">🎉 Application Submitted! 🎉</CardTitle>
      <CardDescription>Your profile is now under review. We'll notify you once it's approved.</CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild>
        <a href="/dashboard">Go to Your Dashboard</a>
      </Button>
    </CardContent>
  </Card>
);

const BecomeSitter = () => {
  const [sitterProfile, setSitterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allSteps = useMemo(() => {
    const steps = [
      { id: 1, component: PersonalInfoForm, name: "Personal Info" },
      { id: 2, component: LocationForm, name: "Location" },
      { id: 3, component: ServicesForm, name: "Services" },
    ];

    if (sitterProfile?.is_boarding_supported) {
      steps.push({ id: 4, component: BoardingForm, name: "Boarding" });
    }
    if (sitterProfile?.is_dog_walking_supported) {
      steps.push({ id: 5, component: WalkingForm, name: "Dog Walking" });
    }
    if (sitterProfile?.is_house_sitting_supported) {
      steps.push({ id: 6, component: HouseSittingForm, name: "House Sitting" });
    }
    if (sitterProfile?.is_drop_in_supported) {
      steps.push({ id: 7, component: DropInForm, name: "Drop-In Visits" });
    }
    if (sitterProfile?.is_day_care_supported) {
      steps.push({ id: 8, component: DayCareForm, name: "Day Care" });
    }

    steps.push(
      { id: 9, component: ExperienceForm, name: "Experience" },
      { id: 10, component: HomeForm, condition: (profile) => profile?.is_boarding_supported || profile?.is_day_care_supported, name: "Home" },
      { id: 11, component: ContentForm, name: "Content" },
      { id: 12, component: PricingForm, name: "Pricing" }
    );

    return steps;
  }, [sitterProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await SitterService.getSitterProfile();
        setSitterProfile(data);
      } catch (err) {
        console.log("No existing sitter profile found. Starting fresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (sitterProfile) {
      const lastStepId = allSteps[allSteps.length - 1].id;
      const startingStep = sitterProfile.onboarding_step || 1;

      if (startingStep > lastStepId) {
        setIsSubmitted(true);
        return;
      }
      
      const isValidStep = allSteps.some(step => step.id === startingStep);
      setCurrentStep(isValidStep ? startingStep : 1);
    }
  }, [sitterProfile, allSteps]);

  const handleSave = (updatedProfile) => {
    setSitterProfile(updatedProfile);
  };

  const handlePrevStep = () => {
    const currentIndex = allSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(allSteps[currentIndex - 1].id);
    }
  };

  const CurrentComponent = allSteps.find(step => step.id === currentStep)?.component;
  const currentStepIndex = allSteps.findIndex(step => step.id === currentStep);
  const progress = Math.round(((currentStepIndex + 1) / allSteps.length) * 100);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-light-gray">
        <p className="text-brand-charcoal">Loading your profile...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="bg-neutral-light-gray min-h-screen py-20 flex items-center justify-center">
        <ReviewScreen />
      </div>
    );
  }
  
  if (!CurrentComponent) {
     return (
      <div className="flex justify-center items-center h-screen bg-neutral-light-gray">
        <p className="text-brand-charcoal">Determining your next step...</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-light-gray min-h-screen py-12">
      <div className="container mx-auto max-w-3xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-charcoal">Become a Wagy Sitter</h1>
          <p className="text-lg text-gray-600 mt-2">Join our community of trusted pet lovers. Let's get your profile set up.</p>
        </header>

        <Progress value={progress} className="mb-8" />
        
        <main>
          <Suspense fallback={<StepLoading />}>
            <CurrentComponent
              profileData={sitterProfile}
              onSave={handleSave}
              onBack={handlePrevStep}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
