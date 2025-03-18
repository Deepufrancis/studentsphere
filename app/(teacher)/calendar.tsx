import { useEffect } from "react";
import * as Calendar from "expo-calendar";
import { Button, View } from "react-native";

async function getCalendarPermissions() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status === "granted") {
    console.log("Access Granted!");
  }
}

export default function CalendarScreen() {
  useEffect(() => {
    getCalendarPermissions();
  }, []);

  return (
    <View>
      <Button title="Check Calendar Access" onPress={getCalendarPermissions} />
    </View>
  );
}
