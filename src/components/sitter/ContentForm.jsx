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
import { X, UploadCloud } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

const contentSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters."),
  bio: z.string().min(50, "Bio must be at least 50 characters.").max(2000, "Bio cannot exceed 2000 characters."),
});

const ContentForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPhotos, setNewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setError, clearErrors } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: { headline: '', bio: '' }
  });

  useEffect(() => {
    const gallery = profileData?.photo_gallery || [];
    setExistingPhotos(gallery);
    reset({
      headline: profileData?.headline || '',
      bio: profileData?.bio || '',
    });
  }, [profileData, reset]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingPhotos.length + newPhotos.length > 10) {
      addToast({ title: "Too many photos", description: "You can only upload a maximum of 10 photos.", variant: "destructive" });
      return;
    }
    setNewPhotos(prev => [...prev, ...files]);
    clearErrors("photo_gallery");
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteConfirmation = (url) => {
    setPhotoToDelete(url);
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await SitterService.deleteGalleryPhotos([photoToDelete]);
      setExistingPhotos(prev => prev.filter(p => p !== photoToDelete));
      addToast({ title: "Photo Deleted", description: "The photo has been removed from your gallery." });
    } catch (err) {
      addToast({ title: "Delete Failed", description: "Could not delete the photo. Please try again.", variant: "destructive" });
    } finally {
      setPhotoToDelete(null);
    }
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    clearErrors("photo_gallery");
    try {
      let finalGallery = [...existingPhotos];
      if (newPhotos.length > 0) {
        const response = await SitterService.uploadGalleryPhotos(newPhotos);
        finalGallery = response.data.photo_gallery || [];
      }

      if (finalGallery.length < 1 || finalGallery.length > 10) {
        setError("photo_gallery", { type: "manual", message: "Please provide between 1 and 10 photos." });
        setIsSubmitting(false);
        return;
      }

      const dataToSave = { ...formData, photo_gallery: finalGallery };
      const finalResponse = await SitterService.updateContent(dataToSave);
      onSave(finalResponse.data);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
      addToast({ title: "Save Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-neutral-gray shadow-md">
          <CardHeader>
            <CardTitle>Profile Content</CardTitle>
            <CardDescription>This is your chance to shine! A great bio and friendly photos will help you stand out.</CardDescription>
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
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="Gallery photo" className="w-full h-24 object-cover rounded-md" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteConfirmation(url)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {newPhotos.map((file, index) => (
                  <div key={index} className="relative group">
                    <img src={URL.createObjectURL(file)} alt="New photo preview" className="w-full h-24 object-cover rounded-md" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewPhoto(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(existingPhotos.length + newPhotos.length) < 10 && (
                  <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-neutral-light-gray text-gray-500">
                    <UploadCloud className="h-8 w-8" />
                    <span className="text-sm mt-1">Add Photos</span>
                    <Input id="photo-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </Label>
                )}
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

      <AlertDialog open={!!photoToDelete} onOpenChange={(isOpen) => !isOpen && setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the photo from your gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPhotoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContentForm;
