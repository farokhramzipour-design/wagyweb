import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <h1 className="text-4xl font-bold">Welcome to Wagy</h1>
      <p className="text-xl text-gray-500">Your trusted pet care companion.</p>
      <div className="flex gap-4">
        <Link to={ROUTES.REGISTER}>
          <Button>Get Started</Button>
        </Link>
        <Link to={ROUTES.ABOUT}>
          <Button variant="outline">Learn More</Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
