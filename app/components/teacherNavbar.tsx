import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Help from "../help";

const screenHeight = Dimensions.get("window").height;

export default function TeacherNavbar() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -250,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsDrawerOpen(false));
    } else {
      setIsDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <View style={styles.navIcons}>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="person-circle-outline" size={35} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Overlay */}
      {isDrawerOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={toggleDrawer}
          activeOpacity={1}
        />
      )}

      {/* Animated Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={() => router.push("/teacher")}>
          <Text style={styles.drawerText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => router.push("/components/settings")}>
          <Text style={styles.drawerText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => router.push("/theme")}>
          <Text style={styles.drawerText}>Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem} onPress={() => router.push("/components/help")}>
          <Text style={styles.drawerText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace("/")}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
  },
  navbar: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navIcons: {
    flexDirection: "row",
    gap: 20,
  },
  overlay: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: -1000,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 15,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 250,
    height: screenHeight,
    backgroundColor: "#F5F5F5",
    padding: 20,
    zIndex: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  drawerItem: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  drawerText: {
    color: "black",
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});
