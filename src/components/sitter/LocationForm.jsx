import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';

// Fix for default Leaflet icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
        <Label htmlFor={name} className="text-brand-charcoal">{label}</Label>
        <Input id={name} {...register(name)} {...props} />
        {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
);

const Checkbox = ({ name, value, label, register }) => (
    <label className="flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-neutral-light-gray cursor-pointer has-[:checked]:bg-brand-green has-[:checked]:text-white has-[:checked]:border-brand-green transition-colors">
        <input type="checkbox" {...register(name)} value={value} className="opacity-0 absolute h-0 w-0" />
        <span>{label}</span>
    </label>
);

const DraggableMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const markerHandlers = useMemo(() => ({
    dragend(e) {
      setPosition(e.target.getLatLng());
    },
  }), [setPosition]);

  return <Marker draggable={true} eventHandlers={markerHandlers} position={position} />;
};

const LocationForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState({ 
    lat: profileData?.location?.latitude || 40.7128, 
    lng: profileData?.location?.longitude || -74.0060 
  });

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: profileData?.location?.country || 'USA',
      city: profileData?.location?.city || '',
      latitude: mapPosition.lat,
      longitude: mapPosition.lng,
      service_radius_km: profileData?.location?.service_radius_km || 10,
      available_days: profileData?.location?.available_days || [],
      available_time_slots: profileData?.location?.available_time_slots || [],
    }
  });

  useEffect(() => {
    setValue('latitude', mapPosition.lat);
    setValue('longitude', mapPosition.lng);
  }, [mapPosition, setValue]);

  const radius = watch('service_radius_km');
  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeSlots = ['morning', 'afternoon', 'evening'];

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData, availability_type: 'part_time' };
      await SitterService.updateLocation(dataToSave);
      onSave({ location: dataToSave });
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
          <CardTitle className="text-brand-charcoal">Location & Availability</CardTitle>
          <CardDescription>Set your service area and schedule. Drag the pin to your approximate location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-64 w-full rounded-lg overflow-hidden z-0">
            <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <DraggableMarker position={mapPosition} setPosition={setMapPosition} />
            </MapContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="country" label="Country" register={register} error={errors.country} />
            <Field name="city" label="City" register={register} error={errors.city} placeholder="e.g., New York" />
          </div>
          <div className="space-y-2">
            <Label className="text-brand-charcoal">Service Radius: {radius} km</Label>
            <Input type="range" min="1" max="100" {...register('service_radius_km')} />
            {errors.service_radius_km && <p className="text-sm text-red-600">{errors.service_radius_km.message}</p>}
          </div>
          <div className="space-y-3">
            <Label className="text-brand-charcoal">Available Days</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {weekDays.map(day => <Checkbox key={day} name="available_days" value={day} label={day.charAt(0).toUpperCase() + day.slice(1)} register={register} />)}
            </div>
            {errors.available_days && <p className="text-sm text-red-600 mt-2">{errors.available_days.message}</p>}
          </div>
          <div className="space-y-3">
            <Label className="text-brand-charcoal">Available Time Slots</Label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map(slot => <Checkbox key={slot} name="available_time_slots" value={slot} label={slot.charAt(0).toUpperCase() + slot.slice(1)} register={register} />)}
            </div>
            {errors.available_time_slots && <p className="text-sm text-red-600 mt-2">{errors.available_time_slots.message}</p>}
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

export default LocationForm;
