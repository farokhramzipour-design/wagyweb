import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Validation schema for the unified input (email or phone)
const loginSchema = z.object({
  identifier: z.string().refine((val) => {
    // Check if it's a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if it's a valid phone number (simple check: digits only, length 10-15)
    // Also explicitly disallow starting with '0' as per requirement
    const phoneRegex = /^[1-9][0-9]{9,14}$/;
    
    return emailRegex.test(val) || phoneRegex.test(val);
  }, {
    message: "Please enter a valid email or phone number (do not start with 0)",
  }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

const Login = () => {
  const { requestOtp, verifyOtp, loginWithGoogle, error: authError, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('input'); // 'input' or 'otp'
  const [identifier, setIdentifier] = useState('');
  const [inputType, setInputType] = useState('email'); // 'email' or 'mobile'
  
  const { register: registerInput, handleSubmit: handleSubmitInput, formState: { errors: inputErrors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerOtp, handleSubmit: handleSubmitOtp, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const determineInputType = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? 'email' : 'mobile';
  };

  const onInputSubmit = async (data) => {
    const type = determineInputType(data.identifier);
    setInputType(type);
    setIdentifier(data.identifier);
    
    try {
      await requestOtp(data.identifier, type);
      setStep('otp');
    } catch (err) {
      // Error is handled in context
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      await verifyOtp(identifier, data.otp, inputType);
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
          <CardTitle>{step === 'input' ? 'Login / Register' : 'Verify OTP'}</CardTitle>
          <CardDescription>
            {step === 'input' 
              ? 'Enter your email or mobile number to continue.' 
              : `Enter the code sent to ${identifier}`
            }
          </CardDescription>
        </CardHeader>
        
        {step === 'input' ? (
          <form onSubmit={handleSubmitInput(onInputSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Mobile Number</Label>
                <Input 
                  id="identifier" 
                  type="text" 
                  placeholder="email@example.com or 9123456789" 
                  {...registerInput("identifier")}
                />
                {inputErrors.identifier && <p className="text-sm text-red-500">{inputErrors.identifier.message}</p>}
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
              <Button type="submit" className="w-full" isLoading={loading}>Continue</Button>
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
                onClick={() => setStep('input')}
                disabled={loading}
              >
                Back
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;
