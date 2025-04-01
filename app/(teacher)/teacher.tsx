import { useRouter, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  BackHandler,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_500Medium, Poppins_700Bold } from "@expo-google-fonts/poppins";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();

  useFocusEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // This prevents the default back action
    });

    return () => backHandler.remove();
  });

  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const today = new Date();
  const day = today.toLocaleDateString("en-US", { weekday: "long" });
  const date = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.dashboardTitle}>Teacher Dashboard</Text>
      <Text style={styles.dateText}>
        {day}, {date}
      </Text>

      <ScrollView contentContainerStyle={styles.cardsContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.card} onPress={() => router.push(item.route)}>
            <View style={styles.cardBackground}>
              <Ionicons name={item.icon} size={40} color="black" />
              <Text style={styles.cardText}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const menuItems = [
  { label: "Courses", icon: "book-outline", route: "/courses" },
  { label: "Assignments", icon: "create-outline", route: "/assignments" },
  { label: "Classes", icon: "school-outline", route: "/class" },
  { label: "Requests", icon: "people-outline", route: "/Requests" },
  { label: "To-do", icon: "calendar-outline", route: "/to-do" },
  { label: "Discussions", icon: "chatbubbles-outline", route: "/(chat)/chatHome" },
  { label: "Attendance", icon: "checkmark-circle-outline", route: "/attendance" },
  { label: "Exams", icon: "clipboard-outline", route: "/exams" },
  { label: "Resources", icon: "document-text-outline", route: "/resources" },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexGrow: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  card: {
    width: "48%",
    marginVertical: 10,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardBackground: {
    paddingVertical: 25,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 0,
  },
  dashboardTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  cardText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
});

