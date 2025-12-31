import { useState, useEffect } from 'react';
import * as SitterService from '@/services/sitterService';

const BecomeSitter = () => {
  const [sitterProfile, setSitterProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await SitterService.getSitterProfile();
        setSitterProfile(data);
        console.log('Sitter Profile:', data);
      } catch (err) {
        setError(err);
        console.error("Failed to fetch sitter profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array ensures this runs only once on mount

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error loading profile. Please try again later.</div>;
  }

  return (
    <div>
      <h1>Become a Sitter</h1>
      <p>Your profile data is loaded. Check the console.</p>
      <pre>{JSON.stringify(sitterProfile, null, 2)}</pre>
    </div>
  );
};

export default BecomeSitter;
