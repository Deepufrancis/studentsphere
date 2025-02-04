import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName='login'>
      <Stack.Screen name="(teach)" options={{headerShown:false }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="(student)" options={{ headerShown: false }}></Stack.Screen>

    </Stack>
  );
}
