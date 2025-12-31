import { createContext, useState, useEffect } from 'react';
import { 
  login as loginService, 
  register as registerService, 
  googleLogin as googleLoginService,
  requestEmailOtp as requestEmailOtpService,
  verifyEmailOtp as verifyEmailOtpService,
  requestMobileOtp as requestMobileOtpService,
  verifyMobileOtp as verifyMobileOtpService,
  logoutUser as logoutUserService
} from '@/services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for stored user/token on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, you would call the API
      // const userData = await loginService(credentials);
      
      // Mock login for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const userData = { id: 1, name: 'Test User', email: credentials.email };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // In a real app, you would call the API
      // const newUser = await registerService(userData);
      
      // Mock register
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const newUser = { id: 2, ...userData };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      // Call the backend with the Google ID token
      const response = await googleLoginService(credentialResponse.credential);
      
      // The backend should return the user data and tokens
      const { user: userData, tokens } = response.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', tokens.access_token);
      
      return userData;
    } catch (err) {
      console.error("Google Login Error:", err);
      setError(err.response?.data?.detail || 'Google login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (identifier, type) => {
    setLoading(true);
    setError(null);
    try {
      if (type === 'email') {
        await requestEmailOtpService(identifier);
      } else {
        await requestMobileOtpService(identifier);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (identifier, otp, type) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (type === 'email') {
        response = await verifyEmailOtpService(identifier, otp);
      } else {
        response = await verifyMobileOtpService(identifier, otp);
      }

      const { user: userData, tokens } = response.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', tokens.access_token);
      
      return userData;
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUserService();
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if the API call fails, we should still clear the local state
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, requestOtp, verifyOtp, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
