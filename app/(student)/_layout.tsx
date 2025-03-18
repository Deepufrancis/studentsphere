import { Slot } from "expo-router";
import StudentNavbar from "../components/studentNavbar";
import { View } from "react-native";

export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <StudentNavbar />
      <Slot />
    </View>
  );
}
