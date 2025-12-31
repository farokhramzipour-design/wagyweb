import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { getSitterProfile, updatePersonalInfo } from '@/services/sitterService';
import { useAuth } from '@/hooks/useAuth';

// Step 1: Personal Information Schema
const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().refine((val) => {
    const date = new Date(val);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 18;
  }, "You must be at least 18 years old"),
  emergency_contact_name: z.string().min(2, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(10, "Valid phone number is required"),
});

const BecomeSitter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(personalInfoSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getSitterProfile();
        setProfile(data);
        // If profile exists, pre-fill form
        if (data) {
          reset({
            full_name: data.full_name || user?.full_name || '',
            date_of_birth: data.date_of_birth || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
          });
          // Set step based on onboarding_step from backend if available
          if (data.onboarding_step) {
             // Logic to map backend step to frontend step can go here
             // For now, we start at step 1 (Personal Info)
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user, reset]);

  const onSubmitPersonalInfo = async (data) => {
    setLoading(true);
    try {
      await updatePersonalInfo(data);
      // Move to next step (Location) - To be implemented
      alert("Personal info saved! Next steps coming soon.");
    } catch (error) {
      console.error("Error updating personal info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Tell us a bit about yourself. This helps build trust with pet owners.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmitPersonalInfo)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" {...register("full_name")} placeholder="John Doe" />
                {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
                {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input id="emergency_contact_name" {...register("emergency_contact_name")} placeholder="Jane Doe" />
                {errors.emergency_contact_name && <p className="text-sm text-red-500">{errors.emergency_contact_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} placeholder="+1234567890" />
                {errors.emergency_contact_phone && <p className="text-sm text-red-500">{errors.emergency_contact_phone.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" isLoading={loading}>Save & Continue</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default BecomeSitter;
