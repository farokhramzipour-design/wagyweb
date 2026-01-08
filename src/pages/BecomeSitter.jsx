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
  const [currentStepId, setCurrentStepId] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const allSteps = useMemo(() => {
    const baseSteps = [
      { id: 1, component: PersonalInfoForm, name: "Personal Info" },
      { id: 2, component: LocationForm, name: "Location" },
      { id: 3, component: ServicesForm, name: "Services" },
    ];

    const serviceSteps = [
      { id: 4, component: BoardingForm, name: "Boarding", condition: (p) => p?.is_boarding_supported },
      { id: 5, component: WalkingForm, name: "Dog Walking", condition: (p) => p?.is_dog_walking_supported },
      { id: 6, component: HouseSittingForm, name: "House Sitting", condition: (p) => p?.is_house_sitting_supported },
      { id: 7, component: DropInForm, name: "Drop-In Visits", condition: (p) => p?.is_drop_in_supported },
      { id: 8, component: DayCareForm, name: "Day Care", condition: (p) => p?.is_day_care_supported },
    ];

    const finalSteps = [
      { id: 9, component: ExperienceForm, name: "Experience" },
      { id: 10, component: HomeForm, name: "Home", condition: (p) => p?.is_boarding_supported || p?.is_day_care_supported },
      { id: 11, component: ContentForm, name: "Content" },
      { id: 12, component: PricingForm, name: "Pricing" },
    ];
    
    let dynamicSteps = [...baseSteps];
    if (sitterProfile) {
        const activeServiceSteps = serviceSteps.filter(s => s.condition(sitterProfile));
        dynamicSteps = [...dynamicSteps, ...activeServiceSteps];
    }
    dynamicSteps.push(...finalSteps);
    
    // Re-assign sequential IDs to ensure navigation works correctly
    return dynamicSteps.map((step, index) => ({ ...step, originalId: step.id, id: index + 1 }));

  }, [sitterProfile]);

  // Effect to fetch initial profile
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

  // Effect to set the current step based on the loaded profile
  useEffect(() => {
    if (sitterProfile && allSteps.length > 1) {
      const lastCompletedStep = sitterProfile.onboarding_step || 0;
      const lastStepId = allSteps[allSteps.length - 1].id;

      if (lastCompletedStep >= lastStepId) {
        setIsSubmitted(true);
        return;
      }
      
      // The step to be on is the last completed step
      const startingStep = allSteps.find(s => s.originalId === lastCompletedStep)?.id + 1 || 1;
      setCurrentStepId(startingStep);
    }
  }, [sitterProfile, allSteps]);

  const handleSave = (updatedProfile) => {
    setSitterProfile(updatedProfile);
  };

  const handlePrevStep = () => {
    const currentIndex = allSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(allSteps[currentIndex - 1].id);
    }
  };

  const CurrentComponent = allSteps.find(step => step.id === currentStepId)?.component;
  const currentStepIndex = allSteps.findIndex(step => step.id === currentStepId);
  const progress = Math.round(((currentStepIndex + 1) / allSteps.length) * 100);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-neutral-light-gray"><p>Loading your profile...</p></div>;
  }
  if (isSubmitted) {
    return <div className="bg-neutral-light-gray min-h-screen py-20 flex items-center justify-center"><ReviewScreen /></div>;
  }
  if (!CurrentComponent) {
    return <div className="flex justify-center items-center h-screen bg-neutral-light-gray"><p>Determining your next step...</p></div>;
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
            <CurrentComponent profileData={sitterProfile} onSave={handleSave} onBack={handlePrevStep} />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
