import { Stack } from 'expo-router';
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="student"/>
      <Stack.Screen name="s_courses"/>
      <Stack.Screen name="menu"/>
    </Stack>
  );
}
