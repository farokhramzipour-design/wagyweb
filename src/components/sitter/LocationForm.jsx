import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as SitterService from '@/services/sitterService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { LocateFixed } from 'lucide-react';
import { debounce } from 'lodash';

const locationSchema = z.object({
  country: z.string().min(2, "Country is required."),
  city: z.string().min(2, "City is required."),
  latitude: z.number(),
  longitude: z.number(),
  service_radius_km: z.coerce.number().min(1).max(100),
  available_days: z.array(z.string()).min(1, "Select at least one available day."),
  available_time_slots: z.array(z.string()).min(1, "Select at least one time slot."),
});

const Field = ({ name, label, register, error, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600 mt-1">{error.message}</p>}
    </div>
);

const Checkbox = ({ name, value, label, register }) => (
    <label className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
        <input type="checkbox" {...register(name)} value={value} className="opacity-0 absolute h-0 w-0" />
        <span>{label}</span>
    </label>
);

const LocationForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: '', city: '', latitude: 35.715298, longitude: 51.404343,
      service_radius_km: 10, available_days: [], available_time_slots: [],
    }
  });

  const reverseGeocode = useCallback(debounce(async (lat, lng) => {
    try {
      const response = await fetch(`https://map.ir/reverse/fast-reverse?lat=${lat}&lon=${lng}`, {
        headers: { 'x-api-key': process.env.VITE_MAP_IR_API_KEY }
      });
      if (!response.ok) throw new Error('Unable to geocode');
      const data = await response.json();
      setValue('city', data.city || '');
      setValue('country', data.country || 'Iran');
    } catch (error) {
      addToast({ title: "Location Error", description: "Could not detect city and country.", variant: "destructive" });
    }
  }, 500), [setValue, addToast]);

  useEffect(() => {
    if (window.mapir && mapRef.current) {
      setIsMapReady(true);
      const initialLat = profileData?.latitude || 35.715298;
      const initialLng = profileData?.longitude || 51.404343;

      const map = new window.mapir.Map({
          container: mapRef.current,
          center: [initialLng, initialLat],
          zoom: 13,
          apiKey: process.env.VITE_MAP_IR_API_KEY,
      });
      mapInstanceRef.current = map;

      const marker = new window.mapir.Marker({
          map: map,
          position: [initialLng, initialLat],
          draggable: true,
      });
      markerRef.current = marker;

      marker.on('dragend', () => {
          const { lng, lat } = marker.getPosition();
          setValue('longitude', lng);
          setValue('latitude', lat);
          reverseGeocode(lat, lng);
      });
      
      if (profileData) {
        reset({
          country: profileData.country || '',
          city: profileData.city || '',
          latitude: initialLat,
          longitude: initialLng,
          service_radius_km: profileData.service_radius_km || 10,
          available_days: profileData.available_days || [],
          available_time_slots: profileData.available_time_slots ? Object.keys(profileData.available_time_slots) : [],
        });
      }

      return () => {
        if (map) map.remove();
      };
    }
  }, [profileData, reset, reverseGeocode, setValue]);

  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([longitude, latitude], 14);
        markerRef.current.setPosition([longitude, latitude]);
        setValue('longitude', longitude);
        setValue('latitude', latitude);
        reverseGeocode(latitude, longitude);
      }
    }, (error) => {
      addToast({ title: "Geolocation Error", description: error.message, variant: "destructive" });
    }, { enableHighAccuracy: true });
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const timeSlotsObject = formData.available_time_slots.reduce((acc, slot) => ({ ...acc, [slot]: true }), {});
      const dataToSave = { 
        ...formData, 
        available_time_slots: timeSlotsObject,
        blackout_dates: profileData?.blackout_dates || [],
        availability_type: 'part_time' 
      };
      const response = await SitterService.updateLocation(dataToSave);
      onSave(response.data);
    } catch (err) {
      addToast({ title: "Save Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="border-neutral-gray shadow-md">
        <CardHeader>
          <CardTitle>Location & Availability</CardTitle>
          <CardDescription>Set your service area. Drag the pin or use your current location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            {isMapReady ? (
              <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
            ) : (
              <div className="flex items-center justify-center h-full">Loading Map...</div>
            )}
            <Button type="button" size="icon" className="absolute top-3 right-3 z-10 bg-white text-brand-charcoal hover:bg-neutral-light-gray shadow-md" onClick={handleLocateMe} disabled={!isMapReady}>
              <LocateFixed className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="country" label="Country" register={register} error={errors.country} />
            <Field name="city" label="City" register={register} error={errors.city} placeholder="e.g., Tehran" />
          </div>
          <div className="space-y-2">
            <Label>Service Radius: {watch('service_radius_km')} km</Label>
            <Input type="range" min="1" max="100" {...register('service_radius_km')} />
          </div>
          <div className="space-y-3">
            <Label>Available Days</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => <Checkbox key={day} name="available_days" value={day} label={day.charAt(0).toUpperCase() + day.slice(1)} register={register} />)}
            </div>
            {errors.available_days && <p className="text-sm text-red-600 mt-2">{errors.available_days.message}</p>}
          </div>
          <div className="space-y-3">
            <Label>Available Time Slots</Label>
            <div className="grid grid-cols-3 gap-3">
              {['morning', 'afternoon', 'evening'].map(slot => <Checkbox key={slot} name="available_time_slots" value={slot} label={slot.charAt(0).toUpperCase() + slot.slice(1)} register={register} />)}
            </div>
            {errors.available_time_slots && <p className="text-sm text-red-600 mt-2">{errors.available_time_slots.message}</p>}
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

export default LocationForm;
