import { useState, useEffect, useMemo } from 'react';
import * as SitterService from '@/services/sitterService';
import PersonalInfoForm from '@/components/sitter/PersonalInfoForm';
import LocationForm from '@/components/sitter/LocationForm';
import ServicesForm from '@/components/sitter/ServicesForm';
import ExperienceForm from '@/components/sitter/ExperienceForm';
import { Progress } from '@/components/ui/Progress';

const BecomeSitter = () => {
  const [sitterProfile, setSitterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

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

  const allSteps = useMemo(() => [
    { id: 1, component: PersonalInfoForm },
    { id: 2, component: LocationForm },
    { id: 3, component: ServicesForm },
    { id: 4, component: ExperienceForm },
    // { id: 5, component: HomeForm, condition: (profile) => profile?.services?.boarding?.active },
    // { id: 6, component: ContentForm },
    // { id: 7, component: PricingForm },
  ], []);

  const activeSteps = useMemo(() => {
    return allSteps.filter(step => !step.condition || step.condition(sitterProfile));
  }, [allSteps, sitterProfile]);

  const CurrentComponent = activeSteps.find(step => step.id === currentStep)?.component;

  const handleNextStep = () => {
    const currentIndex = activeSteps.findIndex(step => step.id === currentStep);
    if (currentIndex < activeSteps.length - 1) {
      setCurrentStep(activeSteps[currentIndex + 1].id);
    } else {
      // Handle final submission
      console.log("Final step reached!");
    }
  };

  const handlePrevStep = () => {
    const currentIndex = activeSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(activeSteps[currentIndex - 1].id);
    }
  };

  const handleSave = (stepData) => {
    setSitterProfile(prev => ({ ...prev, ...stepData }));
    handleNextStep();
  };
  
  const progress = Math.round((currentStep / allSteps.length) * 100);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-light-gray">
        <p className="text-brand-charcoal">Loading your profile...</p>
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
          {CurrentComponent && (
            <CurrentComponent
              profileData={sitterProfile}
              onSave={handleSave}
              onBack={handlePrevStep}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
