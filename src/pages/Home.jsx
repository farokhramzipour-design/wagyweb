import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { Search, Dog, Home as HomeIcon, PawPrint } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 text-center bg-neutral-light-gray">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold text-brand-charcoal md:text-6xl">{t('hero_title')}</h1>
          <p className="mt-4 text-xl text-gray-600">{t('hero_subtitle')}</p>
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center p-2 bg-white rounded-full shadow-lg">
              <Input 
                placeholder={t('find_sitter_placeholder')}
                className="flex-grow text-lg text-gray-700 bg-transparent border-none focus:ring-0"
              />
              <Button className="ml-2 rounded-full bg-accent-orange hover:bg-opacity-90">
                <Search className="w-6 h-6" />
                <span className="ml-2 hidden md:inline">{t('find_sitter')}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-charcoal">{t('our_services')}</h2>
          <div className="grid grid-cols-1 gap-8 mt-10 md:grid-cols-3">
            <ServiceCard 
              icon={<HomeIcon className="w-12 h-12 text-brand-green" />}
              title={t('boarding')}
              description="Your pet stays overnight in your sitter's home. Perfect for vacations."
            />
            <ServiceCard 
              icon={<Dog className="w-12 h-12 text-brand-green" />}
              title={t('dog_walking')}
              description="Your dog gets a walk in your neighborhood. Great for busy days."
            />
            <ServiceCard 
              icon={<PawPrint className="w-12 h-12 text-brand-green" />}
              title={t('day_care')}
              description="Your pet spends the day at your sitter's home. Ideal for your workday."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-neutral-light-gray">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-charcoal">{t('how_it_works')}</h2>
          <div className="grid grid-cols-1 gap-12 mt-10 md:grid-cols-3">
            <HowItWorksStep number="1" title={t('search')} description="Find a trusted sitter in your area who's the perfect match for your pet." />
            <HowItWorksStep number="2" title={t('book_and_pay')} description="Book and pay securely through our platform. It's that simple." />
            <HowItWorksStep number="3" title={t('relax')} description="Enjoy peace of mind knowing your pet is in loving hands." />
          </div>
        </div>
      </section>

      {/* Become a Sitter CTA */}
      <section className="py-20 text-white bg-brand-green">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold">{t('become_a_sitter')}</h2>
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
