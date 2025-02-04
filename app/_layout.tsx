import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName='login'>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />

    </Stack>
  );
}
