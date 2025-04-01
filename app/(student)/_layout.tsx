import { Slot } from "expo-router";
import Navbar from "../components/Navbar";
import { View } from "react-native";

export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <Navbar />
      <Slot />
    </View>
  );
}
