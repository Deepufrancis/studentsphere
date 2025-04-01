import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from "react-native";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;
const DRAWER_WIDTH = 280; 

export default function StudentNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);  // simplified state
  const [userRole, setUserRole] = useState<string>('student');
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const today = new Date();
  const day = today.toLocaleDateString("en-US", { weekday: "long" });
  const date = today.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('loggedInUser');
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedUsername) setUsername(storedUsername);
        if (storedRole) setUserRole(storedRole.toLowerCase());
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    getUserData();
  }, []);

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
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
      <View style={styles.navbar}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <View style={styles.navIcons}>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={30} color="black" />
          </TouchableOpacity>
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={20} color="#4a5568" style={styles.calendarIcon} />
            <View>
              <Text style={styles.dayText}>{day}</Text>
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.overlay,
          { opacity: isDrawerOpen ? 1 : 0, pointerEvents: isDrawerOpen ? 'auto' : 'none' }
        ]} 
        onPress={toggleDrawer} 
      />

      <Animated.View 
        style={[
          styles.drawer, 
          { 
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.avatarIcon}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <Text style={styles.userName}>{username || 'User'}</Text>
          <View style={[styles.roleTag, userRole === 'teacher' && styles.teacherRoleTag]}>
            <Text style={[styles.roleTagText, userRole === 'teacher' && styles.teacherRoleText]}>
              {userRole === 'teacher' ? 'Teacher' : 'Student'}
            </Text>
          </View>
          <Text style={styles.userEmail}>student@example.com</Text>
        </View>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={[styles.drawerItem, pathname === "/student" && styles.activeDrawerItem]} 
          onPress={() => router.push("/student")}
        >
          <Ionicons name="home-outline" size={24} color={pathname === "/student" ? "white" : "#666"} />
          <Text style={[styles.drawerText, pathname === "/student" && styles.activeDrawerText]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.drawerItem, pathname === "/settings" && styles.activeDrawerItem]} 
          onPress={() => router.push("/components/setting")}
        >
          <Ionicons name="settings-outline" size={24} color={pathname === "/settings" ? "white" : "#666"} />
          <Text style={[styles.drawerText, pathname === "/settings" && styles.activeDrawerText]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.drawerItem, pathname === "/help" && styles.activeDrawerItem]} 
          onPress={() => router.push("/help")}
        >
          <Ionicons name="help-circle-outline" size={24} color={pathname === "/help" ? "white" : "#666"} />
          <Text style={[styles.drawerText, pathname === "/help" && styles.activeDrawerText]}>Help</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace("/")}>
          <Ionicons name="log-out-outline" size={24} color="white" />
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: screenHeight,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 25,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,  // Change this line
    width: DRAWER_WIDTH,
    height: screenHeight,
    backgroundColor: "#FFFFFF",
    padding: 0,
    zIndex: 30,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  avatarIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeDrawerItem: {
    backgroundColor: '#007AFF',
    borderLeftWidth: 4,
    borderLeftColor: '#005AC1',
  },
  drawerText: {
    color: '#333',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  activeDrawerText: {
    color: 'white',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 'auto',
    marginBottom: 80, // Increased from 40 to 80 for better Android visibility
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  roleTag: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  teacherRoleTag: {
    backgroundColor: '#FEF3E8',
  },
  roleTagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  teacherRoleText: {
    color: '#FF9500',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
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
});
