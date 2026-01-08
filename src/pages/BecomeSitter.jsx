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

  const activeSteps = useMemo(() => {
    const baseSteps = [
      { originalId: 1, component: PersonalInfoForm, name: "Personal Info" },
      { originalId: 2, component: LocationForm, name: "Location" },
      { originalId: 3, component: ServicesForm, name: "Services" },
    ];

    const serviceSteps = [
      { originalId: 4, component: BoardingForm, name: "Boarding", condition: (p) => p?.is_boarding_supported },
      { originalId: 5, component: HouseSittingForm, name: "House Sitting", condition: (p) => p?.is_house_sitting_supported },
      { originalId: 6, component: DropInForm, name: "Drop-In Visits", condition: (p) => p?.is_drop_in_supported },
      { originalId: 7, component: WalkingForm, name: "Dog Walking", condition: (p) => p?.is_dog_walking_supported },
      { originalId: 8, component: DayCareForm, name: "Day Care", condition: (p) => p?.is_day_care_supported },
    ];

    const finalSteps = [
      { originalId: 9, component: ExperienceForm, name: "Experience" },
      { originalId: 10, component: HomeForm, name: "Home", condition: (p) => p?.is_boarding_supported || p?.is_day_care_supported },
      { originalId: 11, component: ContentForm, name: "Content" },
      { originalId: 12, component: PricingForm, name: "Pricing" },
    ];
    
    let dynamicSteps = [...baseSteps];
    if (sitterProfile) {
        const activeServiceSteps = serviceSteps.filter(s => s.condition(sitterProfile));
        dynamicSteps.push(...activeServiceSteps);
    }
    dynamicSteps.push(...finalSteps.filter(step => !step.condition || !sitterProfile || step.condition(sitterProfile)));
    
    return dynamicSteps.map((step, index) => ({ ...step, id: index + 1 }));
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
    if (sitterProfile && activeSteps.length > 1) {
      const stepFromApi = sitterProfile.onboarding_step || 1;
      const lastPossibleStep = activeSteps[activeSteps.length - 1];

      if (stepFromApi > lastPossibleStep.originalId) {
        setIsSubmitted(true);
        return;
      }
      
      const stepToLoad = activeSteps.find(s => s.originalId === stepFromApi);
      setCurrentStepId(stepToLoad ? stepToLoad.id : 1);
    } else if (!loading) {
      setCurrentStepId(1);
    }
  }, [sitterProfile, activeSteps, loading]);

  const handleNextStep = () => {
    const currentIndex = activeSteps.findIndex(step => step.id === currentStepId);
    const isLastStep = currentIndex === activeSteps.length - 1;

    if (isLastStep) {
      handleFinalSubmit();
    } else {
      setCurrentStepId(activeSteps[currentIndex + 1].id);
    }
  };

  const handleSave = (updatedProfile) => {
    setSitterProfile(updatedProfile);
    handleNextStep();
  };

  const handlePrevStep = () => {
    const currentIndex = activeSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(activeSteps[currentIndex - 1].id);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await SitterService.submitForReview();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  const CurrentComponent = activeSteps.find(step => step.id === currentStepId)?.component;
  const currentStepIndex = activeSteps.findIndex(step => step.id === currentStepId);
  const progress = Math.round(((currentStepIndex + 1) / activeSteps.length) * 100);

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
