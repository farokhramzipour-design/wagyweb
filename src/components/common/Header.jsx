import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="text-2xl font-bold text-primary">Wagy</Link>
        <nav>
          <ul className="flex items-center gap-6">
            <li><Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link to={ROUTES.SERVICES} className="hover:text-primary transition-colors">Services</Link></li>
            <li><Link to={ROUTES.ABOUT} className="hover:text-primary transition-colors">About</Link></li>
            {user && <li><Link to={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">Dashboard</Link></li>}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium">Hello, {user.full_name || user.name || 'User'}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Log Out</Button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
