import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage("Please fill all fields.");
      setModalVisible(true);
      return;
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
        setErrorMessage(data.message || "Login failed.");
        setModalVisible(true);
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again later.");
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a237e", "#534bae", "#ffffff"]} style={styles.background}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.contentContainer}>
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
          <ActivityIndicator size="large" color="#1a237e" />
        ) : (
          <TouchableOpacity onPress={handleLogin} style={styles.loginButtonContainer}>
            <LinearGradient colors={["#1a237e", "#534bae"]} style={styles.loginButton}>
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
  contentContainer: {
    flex: 1,
    margin: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 40,
    color: '#1a237e',
    fontFamily: "Poppins_700Bold",
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loginButton: {
    width: "100%",
    padding: 18,
    alignItems: "center",
    borderRadius: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    color: '#1a237e',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  modalButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});
