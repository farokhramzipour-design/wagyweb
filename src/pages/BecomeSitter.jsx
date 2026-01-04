import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import PersonalInfoForm from '@/components/sitter/PersonalInfoForm';
import LocationForm from '@/components/sitter/LocationForm';
import ServicesForm from '@/components/sitter/ServicesForm';
import { Progress } from '@/components/ui/Progress';


const STEPS = {
  PERSONAL_INFO: 1,
  LOCATION: 2,
  SERVICES: 3,
  // ... other steps will be added here
};

const TOTAL_STEPS = 7; // Total number of steps in the flow

const BecomeSitter = () => {
  const [sitterProfile, setSitterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL_INFO);

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

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = (stepData) => {
    setSitterProfile(prev => ({ ...prev, ...stepData }));
    handleNextStep();
  };
  
  const progress = Math.round((currentStep / TOTAL_STEPS) * 100);

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
          {currentStep === STEPS.PERSONAL_INFO && (
            <PersonalInfoForm 
              profileData={sitterProfile} 
              onSave={handleSave} 
            />
          )}

          {currentStep === STEPS.LOCATION && (
            <LocationForm 
              profileData={sitterProfile}
              onSave={handleSave}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === STEPS.SERVICES && (
            <ServicesForm
              profileData={sitterProfile}
              onSave={handleSave}
              onBack={handlePrevStep}
            />
          )}

          {/* The next steps will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
