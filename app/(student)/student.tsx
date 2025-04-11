import React from "react";
import { useRouter, useNavigation } from "expo-router";
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView, BackHandler, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import useUserData from "../hooks/getUserName";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.7)).current;
  const { username } = useUserData();

  useEffect(() => {
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
      colors={['#f0f5ff', '#e6f0ff']}
      style={styles.mainContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.dashboardTitle}>Student Dkashboard</Text>
          {username && (
            <Text style={styles.welcomeMessage}>Welcome back, {username}!</Text>
          )}
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
                style={styles.gridItem} 
                activeOpacity={0.7}
                onPress={() => router.push("./regcourse")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="book-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Register Courses</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.gridItem} 
                activeOpacity={0.7}
                onPress={() => router.push("./(student_assignment)/AssignmentViewer")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Assignments</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={styles.gridItem} 
                activeOpacity={0.7}
                onPress={() => router.push("./sclass")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="school-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Classes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={true} 
                style={[styles.gridItem, styles.disabledItem]} 
                activeOpacity={0.9}
                onPress={() => router.push("./resources")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="download-outline" size={40} color="#94a3b8" />
                </View>
                <Text style={[styles.gridText, styles.disabledText]}>Resources</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={styles.gridItem}
                activeOpacity={0.7} 
                onPress={() => router.push({
                  pathname: "/(chat)/chatHome",
                  params: { selectedRole: "student" }
                })}>
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Discussions</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.gridItem}
                activeOpacity={0.7} 
                onPress={() => router.push("./sattendance")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkbox-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Attendance</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity 
                style={styles.gridItem}
                activeOpacity={0.7} 
                onPress={() => router.push("/(student)/testing")}>
                <View style={styles.iconContainer}>
                  <Ionicons name="construct-outline" size={40} color="#4a6baf" />
                </View>
                <Text style={styles.gridText}>Testing</Text>
              </TouchableOpacity>
              
              <View style={styles.emptyGridItem} />
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
      shadowColor: "#3b5998",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 10,
    },
    welcomeMessage: {
      fontSize: 16,
      color: "#586993",
      marginTop: 8,
      fontWeight: "500",
    },
    divider: {
      height: 2,
      backgroundColor: "#edf2f7",
      marginBottom: 24,
      width: "95%",
      alignSelf: "center",
    },
    dashboardTitle: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "left",
      color: "#3b5998",
      letterSpacing: 0.5,
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
      marginBottom: 20,
    },
    gridItem: {
      width: "47%",
      height: 140,
      backgroundColor: "#ffffff",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
      marginHorizontal: "1.5%",
      shadowColor: "#3b5998",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(226, 232, 240, 0.95)",
      paddingVertical: 15,
    },
    iconContainer: {
      backgroundColor: "rgba(237, 242, 247, 0.8)",
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    disabledItem: {
      backgroundColor: "#f8fafc",
      borderColor: "#e2e8f0",
      shadowOpacity: 0.07,
    },
    disabledText: {
      color: "#94a3b8",
    },
    emptyGridItem: {
      width: "47%",
      height: 140,
      marginHorizontal: "1.5%",
    },
    gridText: {
      fontSize: 15,
      fontWeight: "600",
      marginTop: 10,
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
      marginBottom: 20,
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
});

