import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

const Login = () => {
  const { requestOtp, verifyOtp, loginWithGoogle, error: authError, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  
  const { register: registerEmail, handleSubmit: handleSubmitEmail, formState: { errors: emailErrors } } = useForm({
    resolver: zodResolver(emailSchema),
  });

  const { register: registerOtp, handleSubmit: handleSubmitOtp, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const onEmailSubmit = async (data) => {
    try {
      await requestOtp(data.email);
      setEmail(data.email);
      setStep('otp');
    } catch (err) {
      // Error is handled in context
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      await verifyOtp(email, data.otp);
      navigate(ROUTES.HOME);
    } catch (err) {
      // Error is handled in context
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse);
      navigate(ROUTES.HOME);
    } catch (err) {
      // Error is handled in context
    }
  };

  const handleGoogleError = () => {
    console.log('Google Login Failed');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{step === 'email' ? 'Login / Register' : 'Verify OTP'}</CardTitle>
          <CardDescription>
            {step === 'email' 
              ? 'Enter your email to continue.' 
              : `Enter the code sent to ${email}`
            }
          </CardDescription>
        </CardHeader>
        
        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail(onEmailSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  {...registerEmail("email")}
                />
                {emailErrors.email && <p className="text-sm text-red-500">{emailErrors.email.message}</p>}
              </div>
              {authError && <p className="text-sm text-red-500">{authError}</p>}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={loading}>Continue with Email</Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSubmitOtp(onOtpSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  maxLength={6}
                  {...registerOtp("otp")}
                />
                {otpErrors.otp && <p className="text-sm text-red-500">{otpErrors.otp.message}</p>}
              </div>
              {authError && <p className="text-sm text-red-500">{authError}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={loading}>Verify & Login</Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep('email')}
                disabled={loading}
              >
                Back to Email
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;
