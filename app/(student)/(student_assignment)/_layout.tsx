import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="AssignmentViewer" options={{ title: "Assignments", headerShown: false }} />
      <Stack.Screen name="AssignmentDetails" options={{ title: "Assignment Details", headerShown: false }} />
    </Stack>
  );
}
