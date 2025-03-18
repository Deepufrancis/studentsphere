import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.7)).current;
  const today = new Date();
  const day = today.toLocaleDateString("en-US", { weekday: "long" }); // Example: Monday
  const date = today.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const [username, setUsername] = useState("");

  useEffect(() => {
    const getUsername = async () => {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    getUsername();
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    Animated.timing(slideAnim, {
      toValue: isDrawerOpen ? -SCREEN_WIDTH * 0.7 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.divider} />
        <Text style={styles.dashboardTitle}>Student Dashboard</Text>
        {username && <Text style={styles.welcomeText}>Welcome, {username}!</Text>}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={24} color="black" style={{ marginRight: 10 }} />
          <Text style={styles.dateText}>{day}, {date}</Text>
        </View>
        
        {/* Grid Layout */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push("./regcourse")}>
                <Ionicons name="book-outline" size={40} color="black" />
                <Text style={styles.gridText}>Register Courses</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem} onPress={() => router.push("./(student_assignment)/AssignmentViewer")}>
                <Ionicons name="document-text-outline" size={40} color="black" />
                <Text style={styles.gridText}>Assignments</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity disabled={true}  style={styles.gridItem} onPress={() => router.push("./classes")}>
                <Ionicons name="school-outline" size={40} color="black" />
                <Text style={styles.gridText}>Classes</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={false} style={styles.gridItem} onPress={() => router.push("./calendar")}>
                <Ionicons name="calendar-outline" size={40} color="black" />
                <Text style={styles.gridText}>Calendar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push("./discussions")}>
                <Ionicons name="chatbubbles-outline" size={40} color="black" />
                <Text style={styles.gridText}>Discussions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem} onPress={() => router.push("./attendance")}>
                <Ionicons name="checkbox-outline" size={40} color="black" />
                <Text style={styles.gridText}>Attendance</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.gridItem} onPress={() => router.push("./exampleassign")}>
                <Ionicons name="newspaper-outline" size={40} color="black" />
                <Text style={styles.gridText}>assignment</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={true} style={styles.gridItem} onPress={() => router.push("./resources")}>
                <Ionicons name="download-outline" size={40} color="black" />
                <Text style={styles.gridText}>Resources</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: 16,
      backgroundColor: "#f0f2f5",
    },
    cardContainer: {
      flex: 1,
      backgroundColor: "#ffffff",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 8,
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: "#f8f9fa",
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    dateText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#333",
    },
    welcomeText: {
      fontSize: 18,
      color: "#666",
      marginBottom: 16,
      textAlign: "center",
    },
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f8f9fa",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    navbar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: "#ffffff",
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 5,
      marginBottom: 15,
    },
    navIcons: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconSpacing: {
      marginRight: 15,
    },
    divider: {
      height: 1,
      backgroundColor: "#ddd",
      marginVertical: 15,
    },
    dashboardTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      color: "#333",
      marginBottom: 15,
    },
    gridContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
      backgroundColor: "#ffffff",
      borderRadius: 15,
    },
    gridRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 15,
    },
    gridItem: {
      width: "47%",
      height: 130,
      backgroundColor: "#ffffff",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 15,
      marginHorizontal: "1.5%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.05)",
    },
    drawer: {
      position: "absolute",
      left: 0,
      top: 0,
      width: SCREEN_WIDTH * 0.7,
      height: "100%",
      backgroundColor: "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      paddingTop: 50,
    },
    closeButton: {
      padding: 12,
    },
    drawerContent: {
      padding: 20,
    },
    drawerItem: {
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 15,
    },
    drawerText: {
      fontSize: 18,
      color: "#333",
    },
    drawerIcon:{
        marginRight:15
    },
    gridText: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 12,
      color: "#2c3e50",
      textAlign: "center",
      letterSpacing: 0.3,
      paddingHorizontal: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
  });

