import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

const dropInSchema = z.object({
  // Add drop-in-specific fields here
});

const DropInForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const { handleSubmit } = useForm({
    resolver: zodResolver(dropInSchema),
    defaultValues: profileData || {},
  });

  const onSubmit = async (formData) => {
    try {
      const response = await SitterService.updateDropInService(formData);
      onSave(response.data);
    } catch (err) {
      addToast({ title: "Save Failed", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Drop-In Visits Service</CardTitle>
          <CardDescription>Set your preferences for drop-in visits.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add form fields for drop-in visits here */}
          <p>Drop-in visit form fields will go here.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default DropInForm;
