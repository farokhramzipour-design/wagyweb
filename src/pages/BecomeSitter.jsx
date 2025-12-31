import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { 
  getSitterProfile, 
  updatePersonalInfo, 
  updateLocation, 
  updateBoardingService, 
  updateWalkingService,
  updateExperience,
  updateHome,
  updateContent,
  updatePricing
} from '@/services/sitterService';
import { useAuth } from '@/hooks/useAuth';

// --- Schemas ---

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

const locationSchema = z.object({
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  service_radius_km: z.coerce.number().min(1, "Radius must be at least 1km").max(50, "Radius cannot exceed 50km"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const experienceSchema = z.object({
  years_of_experience: z.coerce.number().min(0, "Years of experience is required"),
  pet_experience_types: z.array(z.string()).min(1, "Select at least one pet type"),
  breeds_experience: z.array(z.string()).optional(),
  size_experience: z.array(z.string()).min(1, "Select at least one size"),
  puppy_experience: z.boolean(),
  senior_pet_experience: z.boolean(),
  medication_experience: z.boolean(),
  first_aid_certified: z.boolean(),
});

const homeSchema = z.object({
  home_type: z.enum(["house", "apartment", "condo", "farm"]),
  home_ownership: z.enum(["own", "rent"]),
  fenced_yard: z.boolean(),
  yard_size: z.enum(["none", "small", "medium", "large"]),
  pets_in_home: z.boolean(),
  children_in_home: z.boolean(),
  smoking_home: z.boolean(),
  crate_available: z.boolean(),
  cameras_in_home: z.boolean(),
});

const contentSchema = z.object({
  headline: z.string().min(10, "Headline must be at least 10 characters"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  photo_gallery: z.array(z.string()).min(1, "Upload at least one photo"), // Mocking photo upload for now
});

const pricingSchema = z.object({
  base_price: z.coerce.number().min(1, "Base price is required"),
  additional_pet_price: z.coerce.number().min(0),
  puppy_rate: z.coerce.number().min(0),
  holiday_rate: z.coerce.number().min(0),
  long_stay_discount: z.coerce.number().min(0).max(100),
  cancellation_policy: z.enum(["flexible", "moderate", "strict"]),
  payout_method: z.enum(["bank_transfer", "paypal", "stripe"]),
});

// --- Components ---

const PersonalInfoStep = ({ defaultValues, onNext }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Tell us a bit about yourself. This helps build trust with pet owners.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
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
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

function LocationMarker({ position, setPosition, setValue }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setValue('latitude', e.latlng.lat);
      setValue('longitude', e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

const LocationStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      ...defaultValues,
      latitude: defaultValues?.latitude || 51.505,
      longitude: defaultValues?.longitude || -0.09,
    }
  });

  const [position, setPosition] = useState({ 
    lat: defaultValues?.latitude || 51.505, 
    lng: defaultValues?.longitude || -0.09 
  });

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      availability_type: 'part_time',
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      available_time_slots: {},
      blackout_dates: []
    };
    await onNext(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Availability</CardTitle>
        <CardDescription>Where do you want to offer your services? Click on the map to set your location.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country")} placeholder="United States" />
            {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} placeholder="New York" />
            {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="service_radius_km">Service Radius (km)</Label>
            <Input id="service_radius_km" type="number" {...register("service_radius_km")} placeholder="10" />
            {errors.service_radius_km && <p className="text-sm text-red-500">{errors.service_radius_km.message}</p>}
          </div>
          <div className="h-[300px] w-full rounded-md overflow-hidden border">
            <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={position} setPosition={setPosition} setValue={setValue} />
            </MapContainer>
          </div>
          {errors.latitude && <p className="text-sm text-red-500">Please select a location on the map.</p>}
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const ServicesStep = ({ onNext, onBack }) => {
  const [selectedServices, setSelectedServices] = useState({});

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const handleContinue = () => {
    const activeServices = Object.keys(selectedServices).filter(key => selectedServices[key]);
    onNext(activeServices);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Services</CardTitle>
        <CardDescription>Select the services you want to offer.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {['Boarding', 'House Sitting', 'Drop-In Visits', 'Dog Walking', 'Doggy Day Care', 'Dog Training'].map((service) => (
          <div key={service} className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-colors ${selectedServices[service] ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'}`} onClick={() => handleServiceToggle(service)}>
            <input type="checkbox" id={service} checked={!!selectedServices[service]} onChange={() => {}} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none" />
            <label htmlFor={service} className="text-sm font-medium leading-none cursor-pointer pointer-events-none">{service}</label>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
        <Button onClick={handleContinue} className="w-full">Continue</Button>
      </CardFooter>
    </Card>
  );
};

const ExperienceStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      ...defaultValues,
      pet_experience_types: defaultValues?.pet_experience_types || [],
      size_experience: defaultValues?.size_experience || [],
      behavioral_experience: [],
      breeds_experience: []
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience & Skills</CardTitle>
        <CardDescription>Tell us about your experience with pets.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="years_of_experience">Years of Experience</Label>
            <Input id="years_of_experience" type="number" {...register("years_of_experience")} />
            {errors.years_of_experience && <p className="text-sm text-red-500">{errors.years_of_experience.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>Pet Types</Label>
            <div className="flex gap-4">
              {['Dog', 'Cat'].map(type => (
                <label key={type} className="flex items-center space-x-2">
                  <input type="checkbox" value={type} {...register("pet_experience_types")} className="rounded border-gray-300" />
                  <span>{type}</span>
                </label>
              ))}
            </div>
            {errors.pet_experience_types && <p className="text-sm text-red-500">{errors.pet_experience_types.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Size Experience</Label>
            <div className="flex flex-wrap gap-4">
              {['Small (0-15lbs)', 'Medium (16-40lbs)', 'Large (41-100lbs)', 'Giant (100+lbs)'].map(size => (
                <label key={size} className="flex items-center space-x-2">
                  <input type="checkbox" value={size} {...register("size_experience")} className="rounded border-gray-300" />
                  <span>{size}</span>
                </label>
              ))}
            </div>
            {errors.size_experience && <p className="text-sm text-red-500">{errors.size_experience.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("puppy_experience")} className="rounded border-gray-300" />
              <span>Puppy Experience</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("senior_pet_experience")} className="rounded border-gray-300" />
              <span>Senior Pet Experience</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("medication_experience")} className="rounded border-gray-300" />
              <span>Can administer meds</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("first_aid_certified")} className="rounded border-gray-300" />
              <span>First Aid Certified</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const HomeStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(homeSchema),
    defaultValues: {
      ...defaultValues,
      own_pets_details: {}
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home Environment</CardTitle>
        <CardDescription>Describe where the pets will be staying.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home_type">Home Type</Label>
              <select id="home_type" {...register("home_type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="farm">Farm</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_ownership">Ownership</Label>
              <select id="home_ownership" {...register("home_ownership")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="own">Own</option>
                <option value="rent">Rent</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="yard_size">Yard Size</Label>
            <select id="yard_size" {...register("yard_size")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("fenced_yard")} className="rounded border-gray-300" />
              <span>Fenced Yard</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("pets_in_home")} className="rounded border-gray-300" />
              <span>Pets in Home</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("children_in_home")} className="rounded border-gray-300" />
              <span>Children in Home</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("smoking_home")} className="rounded border-gray-300" />
              <span>Smoking Allowed</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("crate_available")} className="rounded border-gray-300" />
              <span>Crate Available</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register("cameras_in_home")} className="rounded border-gray-300" />
              <span>Cameras in Home</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const ContentStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      ...defaultValues,
      photo_gallery: ["mock_photo_url"] // Mocking a photo for validation
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Content</CardTitle>
        <CardDescription>Create your public profile.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" {...register("headline")} placeholder="Loving pet sitter in downtown..." />
            {errors.headline && <p className="text-sm text-red-500">{errors.headline.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea id="bio" {...register("bio")} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Tell pet owners about yourself..." />
            {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
          </div>
          <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>📷 Photo upload functionality will be available in the next update.</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Save & Continue</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const PricingStep = ({ defaultValues, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      ...defaultValues,
      cancellation_policy: 'flexible',
      payout_method: 'bank_transfer'
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Payouts</CardTitle>
        <CardDescription>Set your rates and payment preferences.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onNext)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (per night/walk)</Label>
              <Input id="base_price" type="number" {...register("base_price")} />
              {errors.base_price && <p className="text-sm text-red-500">{errors.base_price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_pet_price">Additional Pet Price</Label>
              <Input id="additional_pet_price" type="number" {...register("additional_pet_price")} />
              {errors.additional_pet_price && <p className="text-sm text-red-500">{errors.additional_pet_price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="puppy_rate">Puppy Rate</Label>
              <Input id="puppy_rate" type="number" {...register("puppy_rate")} />
              {errors.puppy_rate && <p className="text-sm text-red-500">{errors.puppy_rate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday_rate">Holiday Rate</Label>
              <Input id="holiday_rate" type="number" {...register("holiday_rate")} />
              {errors.holiday_rate && <p className="text-sm text-red-500">{errors.holiday_rate.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
            <select id="cancellation_policy" {...register("cancellation_policy")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout_method">Payout Method</Label>
            <select id="payout_method" {...register("payout_method")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="w-full">Back</Button>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>Submit Profile</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

const ReviewStep = ({ onBack }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Submitted!</CardTitle>
        <CardDescription>Your profile is now under review.</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-semibold mb-2">Thank you for applying!</h3>
        <p className="text-gray-600">We will review your information and get back to you shortly.</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => window.location.href = '/dashboard'} className="w-full">Go to Dashboard</Button>
      </CardFooter>
    </Card>
  );
};

// --- Main Component ---

const BecomeSitter = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getSitterProfile();
        setProfile(data);
        // Logic to restore step could go here
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePersonalInfoSubmit = async (data) => {
    try {
      await updatePersonalInfo(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(2);
    } catch (error) {
      console.error("Error updating personal info:", error);
    }
  };

  const handleLocationSubmit = async (data) => {
    try {
      await updateLocation(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(3);
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleServicesSubmit = async (selectedServices) => {
    // Mock saving services
    // In a real app, you'd iterate and call updateBoardingService, etc.
    setStep(4); 
  };

  const handleExperienceSubmit = async (data) => {
    try {
      await updateExperience(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(5);
    } catch (error) {
      console.error("Error updating experience:", error);
    }
  };

  const handleHomeSubmit = async (data) => {
    try {
      await updateHome(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(6);
    } catch (error) {
      console.error("Error updating home:", error);
    }
  };

  const handleContentSubmit = async (data) => {
    try {
      await updateContent(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(7);
    } catch (error) {
      console.error("Error updating content:", error);
    }
  };

  const handlePricingSubmit = async (data) => {
    try {
      await updatePricing(data);
      setProfile(prev => ({ ...prev, ...data }));
      setStep(8);
    } catch (error) {
      console.error("Error updating pricing:", error);
    }
  };

  if (loadingProfile) return <div className="flex justify-center p-10">Loading profile...</div>;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Become a Sitter</h1>
          <span className="text-sm text-gray-500">Step {step} of 8</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(step / 8) * 100}%` }}
          ></div>
        </div>
      </div>

      {step === 1 && (
        <PersonalInfoStep 
          defaultValues={{
            full_name: profile?.full_name || user?.full_name || '',
            date_of_birth: profile?.date_of_birth || '',
            emergency_contact_name: profile?.emergency_contact_name || '',
            emergency_contact_phone: profile?.emergency_contact_phone || '',
          }} 
          onNext={handlePersonalInfoSubmit} 
        />
      )}

      {step === 2 && (
        <LocationStep 
          defaultValues={{
            country: profile?.country || '',
            city: profile?.city || '',
            service_radius_km: profile?.service_radius_km || 10,
            latitude: profile?.latitude,
            longitude: profile?.longitude,
          }}
          onNext={handleLocationSubmit}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <ServicesStep 
          onNext={handleServicesSubmit}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <ExperienceStep 
          defaultValues={{
            years_of_experience: profile?.years_of_experience || 0,
            pet_experience_types: profile?.pet_experience_types || [],
            size_experience: profile?.size_experience || [],
            puppy_experience: profile?.puppy_experience || false,
            senior_pet_experience: profile?.senior_pet_experience || false,
            medication_experience: profile?.medication_experience || false,
            first_aid_certified: profile?.first_aid_certified || false,
          }}
          onNext={handleExperienceSubmit}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && (
        <HomeStep 
          defaultValues={{
            home_type: profile?.home_type || 'house',
            home_ownership: profile?.home_ownership || 'own',
            fenced_yard: profile?.fenced_yard || false,
            yard_size: profile?.yard_size || 'none',
            pets_in_home: profile?.pets_in_home || false,
            children_in_home: profile?.children_in_home || false,
            smoking_home: profile?.smoking_home || false,
            crate_available: profile?.crate_available || false,
            cameras_in_home: profile?.cameras_in_home || false,
          }}
          onNext={handleHomeSubmit}
          onBack={() => setStep(4)}
        />
      )}

      {step === 6 && (
        <ContentStep 
          defaultValues={{
            headline: profile?.headline || '',
            bio: profile?.bio || '',
          }}
          onNext={handleContentSubmit}
          onBack={() => setStep(5)}
        />
      )}

      {step === 7 && (
        <PricingStep 
          defaultValues={{
            base_price: profile?.base_price || 0,
            additional_pet_price: profile?.additional_pet_price || 0,
            puppy_rate: profile?.puppy_rate || 0,
            holiday_rate: profile?.holiday_rate || 0,
            cancellation_policy: profile?.cancellation_policy || 'flexible',
            payout_method: profile?.payout_method || 'bank_transfer',
          }}
          onNext={handlePricingSubmit}
          onBack={() => setStep(6)}
        />
      )}

      {step === 8 && (
        <ReviewStep onBack={() => setStep(7)} />
      )}
    </div>
  );
};

export default BecomeSitter;
