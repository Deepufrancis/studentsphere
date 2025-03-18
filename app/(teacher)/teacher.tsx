import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Poppins_500Medium, Poppins_700Bold } from "@expo-google-fonts/poppins";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <Text style={styles.timeText}>{time}</Text>

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
  { label: "Requests", icon: "people-outline", route: "/Requests" },
  { label: "Calendar", icon: "calendar-outline", route: "/calendar" },
  { label: "Discussions", icon: "chatbubbles-outline", route: "/discussions" },
  { label: "Attendance", icon: "checkmark-circle-outline", route: "/attendance" },
  { label: "Exams", icon: "clipboard-outline", route: "/exams" },
  { label: "Resources", icon: "document-text-outline", route: "/resources" },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  cardsContainer: {
    flexGrow: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  card: {
    width: "48%",
    marginVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  cardBackground: {
    paddingVertical: 30,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  dashboardTitle: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    color: "#555",
    textAlign: "center",
  },
  timeText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#000",
  },
});

