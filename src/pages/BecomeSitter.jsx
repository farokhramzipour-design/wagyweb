import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import * as SitterService from '@/services/sitterService';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

// Lazy load all possible form components
const componentMap = {
  PersonalInfoForm: lazy(() => import('@/components/sitter/PersonalInfoForm')),
  LocationForm: lazy(() => import('@/components/sitter/LocationForm')),
  ServicesForm: lazy(() => import('@/components/sitter/ServicesForm')),
  BoardingForm: lazy(() => import('@/components/sitter/services/BoardingForm')),
  WalkingForm: lazy(() => import('@/components/sitter/services/WalkingForm')),
  HouseSittingForm: lazy(() => import('@/components/sitter/services/HouseSittingForm')),
  DropInForm: lazy(() => import('@/components/sitter/services/DropInForm')),
  DayCareForm: lazy(() => import('@/components/sitter/services/DayCareForm')),
  ExperienceForm: lazy(() => import('@/components/sitter/ExperienceForm')),
  HomeForm: lazy(() => import('@/components/sitter/HomeForm')),
  ContentForm: lazy(() => import('@/components/sitter/ContentForm')),
  PricingForm: lazy(() => import('@/components/sitter/PricingForm')),
};

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
  const [currentStepName, setCurrentStepName] = useState(null);

  // Effect to fetch initial profile and set the starting step
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await SitterService.getSitterProfile();
        setSitterProfile(data);
        setCurrentStepName(data.next_step);
      } catch (err) {
        console.log("No existing sitter profile found. Starting fresh.");
        setCurrentStepName("PersonalInfoForm"); // Default to the first step
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = (updatedProfile) => {
    setSitterProfile(updatedProfile);
    setCurrentStepName(updatedProfile.next_step);
  };

  const CurrentComponent = componentMap[currentStepName];

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-neutral-light-gray"><p>Loading your profile...</p></div>;
  }

  if (currentStepName === "Review") {
    return <div className="bg-neutral-light-gray min-h-screen py-20 flex items-center justify-center"><ReviewScreen /></div>;
  }
  
  if (!CurrentComponent) {
    return <div className="flex justify-center items-center h-screen bg-neutral-light-gray"><p>Could not determine the next step. Please contact support.</p></div>;
  }

  return (
    <div className="bg-neutral-light-gray min-h-screen py-12">
      <div className="container mx-auto max-w-3xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-brand-charcoal">Become a Wagy Sitter</h1>
          <p className="text-lg text-gray-600 mt-2">Join our community of trusted pet lovers. Let's get your profile set up.</p>
        </header>
        
        {/* The progress bar is removed as the concept of total steps is now fully dynamic */}
        
        <main>
          <Suspense fallback={<StepLoading />}>
            <CurrentComponent
              profileData={sitterProfile}
              onSave={handleSave}
              // onBack is removed as the flow is now strictly forward
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
