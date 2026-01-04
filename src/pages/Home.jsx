import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { Search, Dog, Home as HomeIcon, PawPrint } from 'lucide-react'; // Using lucide-react for icons

const ServiceCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 text-center bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
    {icon}
    <h3 className="mt-4 text-xl font-semibold text-brand-charcoal">{title}</h3>
    <p className="mt-2 text-gray-600">{description}</p>
  </div>
);

const HowItWorksStep = ({ number, title, description }) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white rounded-full bg-brand-green">
      {number}
    </div>
    <h3 className="mt-4 text-lg font-semibold text-brand-charcoal">{title}</h3>
    <p className="mt-1 text-gray-600">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="bg-neutral-light-gray">
      {/* Hero Section */}
      <section className="relative py-20 text-white bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center container mx-auto">
          <h1 className="text-5xl font-bold md:text-6xl">Find the perfect pet sitter</h1>
          <p className="mt-4 text-xl text-gray-200">Book trusted sitters and walkers who'll treat your pets like family.</p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center p-2 bg-white rounded-full shadow-lg">
              <Input 
                placeholder="Enter your city or zip code" 
                className="flex-grow text-lg text-gray-700 bg-transparent border-none focus:ring-0"
              />
              <Button className="ml-2 rounded-full bg-accent-orange hover:bg-opacity-90">
                <Search className="w-6 h-6" />
                <span className="ml-2 hidden md:inline">Find a Sitter</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-charcoal">Our Services</h2>
          <p className="mt-2 text-lg text-gray-600">Care your pet will love, from sitters you can trust.</p>
          <div className="grid grid-cols-1 gap-8 mt-10 md:grid-cols-3">
            <ServiceCard 
              icon={<HomeIcon className="w-12 h-12 text-brand-green" />}
              title="Boarding"
              description="Your pet stays overnight in your sitter's home. Perfect for vacations."
            />
            <ServiceCard 
              icon={<Dog className="w-12 h-12 text-brand-green" />}
              title="Dog Walking"
              description="Your dog gets a walk in your neighborhood. Great for busy days."
            />
            <ServiceCard 
              icon={<PawPrint className="w-12 h-12 text-brand-green" />}
              title="Day Care"
              description="Your pet spends the day at your sitter's home. Ideal for your workday."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-neutral-light-gray">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-charcoal">How Wagy Works</h2>
          <div className="grid grid-cols-1 gap-12 mt-10 md:grid-cols-3">
            <HowItWorksStep number="1" title="Search" description="Find a trusted sitter in your area who's the perfect match for your pet." />
            <HowItWorksStep number="2" title="Book & Pay" description="Book and pay securely through our platform. It's that simple." />
            <HowItWorksStep number="3" title="Relax" description="Enjoy peace of mind knowing your pet is in loving hands." />
          </div>
        </div>
      </section>

      {/* Become a Sitter CTA */}
      <section className="py-20 text-white bg-brand-green">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold">Become a Wagy Sitter</h2>
          <p className="mt-4 text-xl text-gray-200">Turn your love for pets into a flexible, rewarding job. We're looking for caring people like you.</p>
          <Link to={ROUTES.BECOME_SITTER}>
            <Button size="lg" className="mt-8 bg-accent-orange hover:bg-opacity-90 text-white text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
