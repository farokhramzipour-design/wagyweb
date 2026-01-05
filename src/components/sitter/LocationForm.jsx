import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as SitterService from '@/services/sitterService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useToast } from '@/hooks/use-toast';
import { LocateFixed } from 'lucide-react';
import { debounce } from 'lodash';

// Fix for default Leaflet icon issue
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
        <Label htmlFor={name}>{label}</Label>
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

const MapEvents = ({ onLocationChange }) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng);
    },
    locationfound(e) {
      onLocationChange(e.latlng);
    },
    dragend(e) {
      onLocationChange(e.target.getLatLng());
    }
  });
  return null;
};

const LocationForm = ({ profileData, onSave, onBack }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState({ lat: 40.7128, lng: -74.0060 });
  const mapRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: 'USA', city: '', latitude: 40.7128, longitude: -74.0060,
      service_radius_km: 10, available_days: [], available_time_slots: [],
    }
  });

  const reverseGeocode = useCallback(debounce(async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: {
          'User-Agent': 'WagyWebApp/1.0 (behnam.z.web@gmail.com)' // Replace with your app info
        }
      });
      if (!response.ok) throw new Error('Unable to geocode');
      const data = await response.json();
      if (data.address) {
        setValue('city', data.address.city || data.address.town || data.address.village || '');
        setValue('country', data.address.country || '');
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      addToast({ title: "Location Error", description: "Could not automatically detect city and country.", variant: "destructive" });
    }
  }, 500), [setValue, addToast]);

  useEffect(() => {
    if (profileData) {
      const { country, city, latitude, longitude, service_radius_km, available_days, available_time_slots } = profileData;
      const lat = latitude || 40.7128;
      const lng = longitude || -74.0060;
      setMapPosition({ lat, lng });
      if (mapRef.current) {
        mapRef.current.flyTo({ lat, lng }, 13);
      }
      reset({
        country: country || 'USA',
        city: city || '',
        latitude: lat,
        longitude: lng,
        service_radius_km: service_radius_km || 10,
        available_days: available_days || [],
        available_time_slots: available_time_slots ? Object.keys(available_time_slots) : [],
      });
    }
  }, [profileData, reset]);

  const handleLocationChange = (latlng) => {
    setMapPosition(latlng);
    setValue('latitude', latlng.lat);
    setValue('longitude', latlng.lng);
    reverseGeocode(latlng.lat, latlng.lng);
    if (mapRef.current) {
      mapRef.current.flyTo(latlng, mapRef.current.getZoom());
    }
  };

  const handleLocateMe = () => {
    if (mapRef.current) {
      mapRef.current.locate();
    }
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
          <div className="relative h-64 w-full rounded-lg overflow-hidden z-0">
            <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <Marker draggable={true} position={mapPosition} eventHandlers={{ dragend: (e) => handleLocationChange(e.target.getLatLng()) }} />
              <MapEvents onLocationChange={handleLocationChange} />
            </MapContainer>
            <Button type="button" size="icon" className="absolute top-3 right-3 z-[1000] bg-white text-brand-charcoal hover:bg-neutral-light-gray shadow-md" onClick={handleLocateMe}>
              <LocateFixed className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field name="country" label="Country" register={register} error={errors.country} />
            <Field name="city" label="City" register={register} error={errors.city} placeholder="e.g., New York" />
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
