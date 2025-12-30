import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

// Since registration is now handled via the unified Email/OTP flow,
// we can redirect the /register route to /login.
const Register = () => {
  return <Navigate to={ROUTES.LOGIN} replace />;
};

export default Register;
