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
import { X } from 'lucide-react';

const contentSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters."),
  bio: z.string().min(50, "Bio must be at least 50 characters.").max(2000, "Bio cannot exceed 2000 characters."),
  photo_gallery: z.array(z.string()).min(1, "Please upload at least one photo.").max(10, "You can upload a maximum of 10 photos."),
});

const ContentForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPhotos, setNewPhotos] = useState([]); // Files to be uploaded
  const [existingPhotos, setExistingPhotos] = useState(profileData?.content?.photo_gallery || []);

  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      headline: '',
      bio: '',
      photo_gallery: [],
    }
  });

  useEffect(() => {
    if (profileData?.content) {
      reset(profileData.content);
      setExistingPhotos(profileData.content.photo_gallery || []);
    }
  }, [profileData, reset]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingPhotos.length + newPhotos.length > 10) {
      addToast({ title: "Too many photos", description: "You can only upload a maximum of 10 photos.", variant: "destructive" });
      return;
    }
    setNewPhotos(prev => [...prev, ...files]);
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (url) => {
    setExistingPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let uploadedUrls = [];
      if (newPhotos.length > 0) {
        const uploadPromises = newPhotos.map(file => SitterService.uploadGalleryPhoto(file));
        const responses = await Promise.all(uploadPromises);
        uploadedUrls = responses.map(res => res.data.url);
      }

      const finalGallery = [...existingPhotos, ...uploadedUrls];
      setValue('photo_gallery', finalGallery);

      // Manually trigger validation again after setting value
      const isValid = await handleSubmit(() => {})();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const dataToSave = { ...getValues(), photo_gallery: finalGallery };
      await SitterService.updateContent(dataToSave);
      onSave({ content: dataToSave });

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
            <Label htmlFor="headline">Profile Headline</Label>
            <Input id="headline" {...register('headline')} placeholder="e.g., Your friendly neighborhood dog lover" />
            {errors.headline && <p className="text-sm text-red-600 mt-1">{errors.headline.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About You</Label>
            <Textarea id="bio" {...register('bio')} rows="6" placeholder="Tell pet owners a little about yourself..." />
            {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Photo Gallery (1-10 photos)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {existingPhotos.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="Gallery photo" className="w-full h-24 object-cover rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeExistingPhoto(url)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {newPhotos.map((file, index) => (
                <div key={index} className="relative">
                  <img src={URL.createObjectURL(file)} alt="New photo preview" className="w-full h-24 object-cover rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeNewPhoto(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Label htmlFor="photo-upload" className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-neutral-light-gray">
                <span>+ Add</span>
                <Input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </Label>
            </div>
            {errors.photo_gallery && <p className="text-sm text-red-600 mt-2">{errors.photo_gallery.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-neutral-light-gray p-4 rounded-b-lg">
          <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ContentForm;
