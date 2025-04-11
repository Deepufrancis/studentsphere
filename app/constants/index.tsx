import Constants from 'expo-constants';

const getLocalHost = (): string => {
  // @ts-ignore - suppress type checking here, it's safe for development use
  const debuggerHost = Constants.manifest?.debuggerHost ?? Constants.expoConfig?.hostUri;
  const ipAddress = debuggerHost?.split(':')[0];
  return ipAddress ?? 'localhost';
};

export const API_BASE_URL = `http://${getLocalHost()}:5000/api`;
