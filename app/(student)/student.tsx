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

  const buttons = [
    [
      {
        icon: "book-outline",
        text: "Register Courses",
        onPress: () => router.push("./regcourse"),
      },
      {
        icon: "document-text-outline",
        text: "Assignments",
        onPress: () => router.push("./(student_assignment)/AssignmentViewer"),
      }
    ],
    [
      {
        icon: "school-outline",
        text: "Classes",
        onPress: () => router.push("./sclass"),
      },
      {
        icon: "chatbubbles-outline",
        text: "Discussions",
        onPress: () => router.push({
          pathname: "/schat",
          params: { selectedRole: "student" }
        }),
      }
    ],
    [
      {
        icon: "checkbox-outline",
        text: "Attendance",
        onPress: () => router.push("./sattendance"),
      },
      {
        icon: "construct-outline",
        text: "Testing",
        onPress: () => router.push("/(student)/testing"),
      }
    ],
    [
      {
        icon: "download-outline",
        text: "Resources",
        onPress: () => router.push("./sresources"),
      },
      {
        icon: "information-circle-outline", // Added a placeholder icon
        text: "Coming Soon",
        onPress: () => {},
        disabled: true
      }
    ]
  ];

  return (
    <LinearGradient
      colors={['#f0f5ff', '#e6f0ff']}
      style={styles.mainContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.dashboardTitle}>Student Dashboard</Text>
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
            {buttons.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((button, buttonIndex) => (
                  <TouchableOpacity
                    key={`${rowIndex}-${buttonIndex}`}
                    style={[styles.gridItem, button.disabled && styles.disabledItem]}
                    activeOpacity={button.disabled ? 0.9 : 0.7}
                    disabled={button.disabled}
                    onPress={button.onPress}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons 
                        name={button.icon} 
                        size={40} 
                        color={button.disabled ? "#94a3b8" : "#4a6baf"} 
                      />
                    </View>
                    <Text style={[styles.gridText, button.disabled && styles.disabledText]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
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

