import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function TeacherProfile() {
  const [username, setUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) setUsername(storedUsername);
      } catch (error) {
        console.error('Error loading username:', error);
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.usernameText}>Username: {username || "N/A"}</Text>
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  usernameText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  logoutButton: {
    padding: 12,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#D32F2F",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
});
