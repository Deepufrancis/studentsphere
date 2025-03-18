import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../constants";

export default function LoginTeacher() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert("Error", "Please fill all fields.");
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "teacher" }),
      });
      const data = await response.json();

      if (response.status === 200) {
        await AsyncStorage.setItem("loggedInUser", username);
        await AsyncStorage.setItem("userRole", "teacher");
        router.replace("/teacher");
      } else {
        Alert.alert("Error", data.message || "Login failed.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#808080", "#FFFFFF"]} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Teacher Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <TouchableOpacity onPress={handleLogin} style={styles.loginButtonContainer}>
            <LinearGradient colors={["#007AFF", "#0051A3"]} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontFamily: "Poppins_700Bold",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#EAEAEA",
    borderRadius: 12,
    marginBottom: 15,
    fontFamily: "Poppins_500Medium",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#EAEAEA",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontFamily: "Poppins_500Medium",
  },
  eyeButton: {
    padding: 12,
  },
  loginButtonContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  loginButton: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    borderRadius:25,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
});
