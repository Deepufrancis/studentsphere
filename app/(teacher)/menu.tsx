import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function StudentProfile() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      setUsername(storedUsername);
    };
    loadUserData();
  }, []);
  const handleLogout = async () => {
    Alert.alert(
      "Logout", "Are you sure you want to logout",
      [
        {
          text: "cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teacher Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{username || "N/A"}</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    padding: 15,
    backgroundColor: "#EAEAEA",
    borderRadius: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  logoutButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
