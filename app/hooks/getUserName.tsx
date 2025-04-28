import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserData = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const [storedUsername, storedRole] = await Promise.all([
          AsyncStorage.getItem('loggedInUser'),
          AsyncStorage.getItem('userRole'),
        ]);

        if (storedUsername) {
          try {
            const userData = JSON.parse(storedUsername);
            const displayName = userData?.username || userData?.name || null;
            setUsername(displayName);
          } catch (parseError) {
            // If the stored value is a plain string, use it directly
            setUsername(storedUsername);
          }
        }

        if (storedRole) {
          try {
            const roleData = JSON.parse(storedRole);
            setUserRole(typeof roleData === 'string' ? roleData.toLowerCase() : null);
          } catch (parseError) {
            setUserRole(storedRole.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    getUserData();
  }, []);

  return { username, userRole, error, isLoading };
};

export default useUserData;
