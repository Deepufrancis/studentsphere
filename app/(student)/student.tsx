import React from "react";
import { useRouter, useNavigation } from "expo-router";
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
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

    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
      headerBackVisible: false
    });

    const onBackPress = () => {
      return true; // Prevent back navigation
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    Animated.timing(slideAnim, {
      toValue: isDrawerOpen ? -SCREEN_WIDTH * 0.7 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f8fafc']}
      style={styles.mainContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.dashboardTitle}>Student Dashboard</Text>
        </View>
        <View style={styles.divider} />
        
        {/* Grid Layout */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={[styles.gridItem, styles.gridItemHover]} 
                onPress={() => router.push("./regcourse")}>
                <Ionicons name="book-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Register Courses</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.gridItem, styles.gridItemHover]} 
                onPress={() => router.push("./(student_assignment)/AssignmentViewer")}>
                <Ionicons name="document-text-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Assignments</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridItem, styles.gridItemHover]} onPress={() => router.push("./sclass")}>
                <Ionicons name="school-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Classes</Text>
              </TouchableOpacity>

              <TouchableOpacity disabled={true} style={[styles.gridItem, styles.gridItemHover]} onPress={() => router.push("./resources")}>
                <Ionicons name="download-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Resources</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity style={[styles.gridItem, styles.gridItemHover]} onPress={() => router.push({
                pathname: "/(chat)/chatHome",
                params: { selectedRole: "student" }
              })}>
                <Ionicons name="chatbubbles-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Discussions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.gridItem, styles.gridItemHover]} onPress={() => router.push("./sattendance")}>
                <Ionicons name="checkbox-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Attendance</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              

              <TouchableOpacity style={[styles.gridItem, styles.gridItemHover]} onPress={() => router.push("/(student)/testing")}>
                <Ionicons name="construct-outline" size={40} color="#2d3748" />
                <Text style={styles.gridText}>Testing</Text>
              </TouchableOpacity>

            </View>

            
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      padding: 16,
    },
    cardContainer: {
      flex: 1,
      backgroundColor: "#ffffff",
      borderRadius: 20,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 15,
      elevation: 10,
    },
    dateContainer: {
      padding: 16,
      backgroundColor: "#f8fafc",
      borderRadius: 16,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: "rgba(226, 232, 240, 0.8)",
    },
    dateWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    calendarIcon: {
      marginRight: 8,
    },
    dayText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#2d3748",
    },
    dateText: {
      fontSize: 12,
      color: "#4a5568",
    },
    welcomeText: {
      fontSize: 20,
      color: "#2d3748",
      marginBottom: 20,
      textAlign: "center",
      fontWeight: "500",
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
      height: 2,
      backgroundColor: "#f1f5f9",
      marginBottom: 24,
      width: "95%",
      alignSelf: "center",
    },
    dashboardTitle: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "left",
      color: "#1a365d",
      letterSpacing: 0.7,
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
      borderRadius: 12,
      marginHorizontal: "1.5%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(226, 232, 240, 0.95)",
      transform: [{ scale: 1 }],
    },
    gridItemHover: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 7,
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
      fontSize: 14,
      fontWeight: "600",
      marginTop: 14,
      color: "#334155",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    headerContainer: {
      marginVertical: 16,
      paddingHorizontal: 10,
      marginBottom: 24,
    },
  });

