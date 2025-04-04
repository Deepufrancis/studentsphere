import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Modal, Image } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const [user, setUser] = useState<{ username: string; email: string; role: string; courses: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (!storedUsername) {
          setError("No user found");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/users/profile?username=${storedUsername}`);
        setUser(response.data);
        setProfilePicture(response.data.profilePicture);
      } catch (err) {
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateEmail = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/update/${user?.username}`, {
        email: newEmail
      });
      setUser(response.data);
      setIsEditingEmail(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update email");
    }
  };

  const handleUpdateUsername = async () => {
    try {
      if (!newUsername.trim()) {
        setError("Username cannot be empty");
        return;
      }
      
      const response = await axios.put(`${API_BASE_URL}/users/update/${user?.username}`, {
        newUsername
      });
      
      setUser(response.data);
      setIsEditingUsername(false);
      setError("");
      await AsyncStorage.setItem("loggedInUser", response.data.username);
      setShowSuccessModal(true);
      
      // Clear success modal after delay
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update username");
      setIsEditingUsername(true); // Keep editing mode active on error
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        try {
          const base64Image = result.assets[0].base64;
          const response = await axios.put(
            `${API_BASE_URL}/users/profile-picture/${user?.username}`,
            { imageUrl: base64Image }  // Send just the base64 string
          );
          setProfilePicture(response.data.profilePicture);
          setShowActionModal(false);
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to update profile picture");
        }
      }
    } catch (err: any) {
      setError("Failed to pick image");
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/users/profile-picture/${user?.username}`
      );
      setProfilePicture(null);
      setShowActionModal(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete profile picture");
    }
  };

  // Clear error when switching edit modes
  useEffect(() => {
    setError("");
  }, [isEditingEmail, isEditingUsername]);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => setShowImageModal(true)} style={styles.profileImageContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImagePlaceholderText}>No Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowActionModal(true)} style={styles.editIconContainer}>
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
      {isEditingUsername ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="Enter new username"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleUpdateUsername} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingUsername(false)} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.userInfoContainer}>
          <Text style={styles.text}>Hello, {user?.username}!</Text>
          <TouchableOpacity onPress={() => {
            setNewUsername(user?.username || "");
            setIsEditingUsername(true);
          }}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isEditingEmail ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email"
            keyboardType="email-address"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleUpdateEmail} style={styles.button}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingEmail(false)} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emailContainer}>
          <Text style={styles.emailText}>Email: {user?.email}</Text>
          <TouchableOpacity onPress={() => {
            setNewEmail(user?.email || "");
            setIsEditingEmail(true);
          }}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.roleText}>Role: {user?.role}</Text>

      <Modal
        transparent={true}
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.successText}>Username updated successfully!</Text>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={showImageModal}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={styles.imageModalContainer} 
          activeOpacity={1} 
          onPress={() => setShowImageModal(false)}
        >
          {profilePicture && (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent={true}
        visible={showActionModal}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer} 
          activeOpacity={1} 
          onPress={() => setShowActionModal(false)}
        >
          <View style={[styles.modalContent, styles.actionModalContent]}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setShowActionModal(false);
                pickImage();
              }}
            >
              <Text style={styles.actionButtonText}>Change Picture</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={handleDeleteProfilePicture}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Picture</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  text: { fontSize: 24, color: "#007AFF" },
  emailText: { fontSize: 16, color: "#555", marginTop: 5 },
  roleText: { fontSize: 18, color: "#666", marginTop: 10 },
  courseTitle: { fontSize: 20, fontWeight: "bold", marginTop: 20 },
  courseText: { fontSize: 16, color: "#444", marginTop: 5 },
  loading: { flex: 1, justifyContent: "center" },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  editContainer: {
    width: '100%',
    paddingHorizontal: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    width: '100%'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  editText: {
    color: '#007AFF',
    textDecorationLine: 'underline'
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  successText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  profileSection: {
    position: 'relative',
    marginBottom: 20,
  },
  editIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#e1e1e1',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
  },
  profileImagePlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  actionModalContent: {
    width: '80%',
    padding: 0,
    overflow: 'hidden',
  },
  actionButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
});

export default ProfileScreen;
