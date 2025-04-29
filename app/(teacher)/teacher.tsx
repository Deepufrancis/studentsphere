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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Poppins_500Medium, Poppins_700Bold } from "@expo-google-fonts/poppins";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();

  useFocusEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; 
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

  return (
    <View style={styles.container}>
      <Text style={styles.dashboardTitle}>Teacher Dashboard</Text>
      <ScrollView contentContainerStyle={styles.cardsContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.card} onPress={() => router.push(item.route)}>
            <View style={styles.cardBackground}>
              <MaterialCommunityIcons name={item.icon} size={40} color={item.color} />
              <Text style={styles.cardText}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const menuItems = [
  { label: "Classroom", icon: "google-classroom", route: "/tclassroom", color: "#4361EE" },
  { label: "Courses", icon: "book-open-variant", route: "/courses", color: "#4361EE" },
  { label: "Assignments", icon: "file-document-outline", route: "/assignments", color: "#3DAD5B" },
  { label: "Classes", icon: "school-outline", route: "/class", color: "#FF6B6B" },
  { label: "Requests", icon: "email-outline", route: "/Requests", color: "#FFC857" },
  { label: "Discussions", icon: "forum-outline", route: "/tchat", color: "#845EC2" },
  { label: "Attendance", icon: "calendar-check", route: "/attendance", color: "#00C2A8" },
  { label: "Exams", icon: "file-certificate-outline", route: "/exams/exams", color: "#FF6B6B" },
  { label: "Resources", icon: "bookshelf", route: "/resources", color: "#4D8076" },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f5", // updated background for a softer look
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
    marginVertical: 12, // increased margin for spacing
    borderRadius: 16,
    elevation: 4, // deeper shadow for a subtle lift
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardBackground: {
    paddingVertical: 25,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1, // added border for definition
    borderColor: "#e0e0e0",
  },
  dashboardTitle: {
    fontSize: 30, // increased font size for prominence
    fontFamily: "Poppins_700Bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10, // slightly increased margin
    textShadowColor: "rgba(0, 0, 0, 0.1)", // subtle text shadow for improved aesthetics
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
});

