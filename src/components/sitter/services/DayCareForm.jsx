import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

const dayCareSchema = z.object({
  // Add day care-specific fields here
});

const DayCareForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const { handleSubmit } = useForm({
    resolver: zodResolver(dayCareSchema),
    defaultValues: profileData || {},
  });

  const onSubmit = async (formData) => {
    try {
      const response = await SitterService.updateDayCareService(formData);
      onSave(response.data);
    } catch (err) {
      addToast({ title: "Save Failed", description: err.response?.data?.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Doggy Day Care Service</CardTitle>
          <CardDescription>Set your preferences for day care.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add form fields for day care here */}
          <p>Day care form fields will go here.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit">Save & Continue</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default DayCareForm;
