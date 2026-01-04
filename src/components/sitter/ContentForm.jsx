import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

const contentSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters."),
  bio: z.string().min(50, "Bio must be at least 50 characters.").max(2000, "Bio cannot exceed 2000 characters."),
});

const ContentForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      headline: '',
      bio: '',
    }
  });

  useEffect(() => {
    if (profileData?.content) {
      reset(profileData.content);
    }
  }, [profileData, reset]);

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await SitterService.updateContent(formData);
      onSave({ content: formData });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      addToast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="border-neutral-gray shadow-md">
        <CardHeader>
          <CardTitle className="text-brand-charcoal">Profile Content</CardTitle>
          <CardDescription>This is your chance to shine! Create a headline and bio that will stand out to pet owners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="headline" className="text-brand-charcoal">Profile Headline</Label>
            <Input id="headline" {...register('headline')} placeholder="e.g., Your friendly neighborhood dog lover" />
            {errors.headline && <p className="text-sm text-red-600 mt-1">{errors.headline.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-brand-charcoal">About You</Label>
            <Textarea id="bio" {...register('bio')} rows="8" placeholder="Tell pet owners a little about yourself. Why do you love pets? What makes you a great sitter?" />
            {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-green hover:bg-opacity-90 text-white">
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ContentForm;
