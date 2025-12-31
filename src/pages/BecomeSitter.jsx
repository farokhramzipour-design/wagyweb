import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import PersonalInfoForm from '@/components/sitter/PersonalInfoForm';

const STEPS = {
  PERSONAL_INFO: 1,
  LOCATION: 2,
  // ... other steps
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
        // It's okay if the profile doesn't exist yet
        console.log("No existing sitter profile found. Starting fresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePersonalInfoSave = (updatedData) => {
    setSitterProfile(prev => ({ ...prev, ...updatedData }));
    // setCurrentStep(STEPS.LOCATION); // <-- We'll enable this later
    console.log("Personal Info Saved!", updatedData);
    alert("Step 1 complete! Check the console. Next step is not yet implemented.");
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Become a Sitter</h1>
      
      {currentStep === STEPS.PERSONAL_INFO && (
        <PersonalInfoForm 
          profileData={sitterProfile} 
          onSave={handlePersonalInfoSave} 
        />
      )}

      {/* Other steps will go here */}
      {/* {currentStep === STEPS.LOCATION && <LocationForm />} */}
    </div>
  );
};

export default BecomeSitter;
