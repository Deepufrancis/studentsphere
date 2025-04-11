import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserData = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const [storedUsername, storedRole] = await Promise.all([
          AsyncStorage.getItem('loggedInUser'),
          AsyncStorage.getItem('userRole'),
        ]);
        if (storedUsername) setUsername(storedUsername);
        if (storedRole) setUserRole(storedRole.toLowerCase());
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    getUserData();
  }, []);

  return { username, userRole };
};

export default useUserData;
