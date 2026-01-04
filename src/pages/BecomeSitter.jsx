import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import PersonalInfoForm from '@/components/sitter/PersonalInfoForm';

const STEPS = {
  PERSONAL_INFO: 1,
  LOCATION: 2,
  // ... other steps will be added here
};

const BecomeSitter = () => {
  const [sitterProfile, setSitterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL_INFO);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await SitterService.getSitterProfile();
        setSitterProfile(data);
      } catch (err) {
        console.log("No existing sitter profile found. Starting fresh.");
        // No need to set an error state if the profile just doesn't exist yet.
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePersonalInfoSave = (updatedData) => {
    setSitterProfile(prev => ({ ...prev, ...updatedData }));
    // setCurrentStep(STEPS.LOCATION); // We'll uncomment this when the next step is ready
    console.log("Personal Info Saved!", updatedData);
    alert("Step 1 Complete! Check the console for the saved data. The next step is not yet implemented.");
  };

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
        
        <main>
          {currentStep === STEPS.PERSONAL_INFO && (
            <PersonalInfoForm 
              profileData={sitterProfile} 
              onSave={handlePersonalInfoSave} 
            />
          )}

          {/* The next steps in the form will be rendered here */}
          {/* e.g., {currentStep === STEPS.LOCATION && <LocationForm />} */}
        </main>
      </div>
    </div>
  );
};

export default BecomeSitter;
