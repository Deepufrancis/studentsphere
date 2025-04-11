import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, Image, TextInput, Modal } from "react-native";
import { useState, useRef, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { Calendar } from 'react-native-calendars';

const screenHeight = Dimensions.get("window").height;
const DRAWER_WIDTH = 280; 

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId?: string;
}

export default function StudentNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);  // simplified state
  const [userRole, setUserRole] = useState<string>('student');
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("teacher@example.com");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [showImageActionModal, setShowImageActionModal] = useState(false);
  const [error, setError] = useState("");
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDateAssignments, setSelectedDateAssignments] = useState<Assignment[]>([]);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          const response = await axios.get(`${API_BASE_URL}/users/profile?username=${storedUsername}`);
          setEmailAddress(response.data.email);
          setProfilePicture(response.data.profilePicture);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/assignments`);
        setAssignments(response.data);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
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

  const handleUpdateEmail = async () => {
    try {
      const username = await AsyncStorage.getItem("loggedInUser");
      const response = await axios.put(`${API_BASE_URL}/users/update/${username}`, {
        email: newEmail
      });
      setEmailAddress(response.data.email);
      setIsEditingEmail(false);
      setSuccessMessage("Email updated successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Error updating email:', error);
    }
  };

  const handleUpdateUsername = async () => {
    try {
      if (!newUsername.trim()) {
        setError("Username cannot be empty");
        return;
      }
      
      const response = await axios.put(`${API_BASE_URL}/users/update/${username}`, {
        newUsername
      });
      
      setUsername(response.data.username);
      await AsyncStorage.setItem("loggedInUser", response.data.username);
      setIsEditingUsername(false);
      setSuccessMessage("Username updated successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Error updating username:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.1,
        base64: true,
      });
    
      if (!result.canceled && result.assets[0].base64) {
        try {
          const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
          const response = await axios.put(
            `${API_BASE_URL}/users/profile-picture/${username}`,
            { imageUrl: base64Image }
          );
          
          setProfilePicture(response.data.profilePicture);
          setShowImageActionModal(false);
          setSuccessMessage("Profile picture updated successfully!");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        } catch (error: any) {
          console.error('Error updating profile picture:', error);
          setSuccessMessage("Error: Failed to upload image. Please try a smaller image.");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError("Failed to pick image");
    }
  };
  
  const handleDeleteProfilePicture = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/users/profile-picture/${username}`);
      setProfilePicture(null);
      setShowImageActionModal(false);
      setSuccessMessage("Profile picture removed successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }
  };

  const handleDateSelect = (date: any) => {
    const selectedDateStr = new Date(date.timestamp).toISOString().split('T')[0];
    const assignmentsForDate = assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];
      return dueDate === selectedDateStr;
    });

    if (assignmentsForDate.length > 0) {
      setSelectedDateAssignments(assignmentsForDate);
      setShowAssignmentsModal(true);
    }
    
    setSelectedDate(new Date(date.timestamp));
    setShowCalendar(false);
  };

  const getMarkedDates = () => {
    const markedDates: any = {};
    
    markedDates[selectedDate.toISOString().split('T')[0]] = {
      selected: true,
      selectedColor: '#007AFF'
    };

    assignments.forEach(assignment => {
      const dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];
      if (markedDates[dueDate]) {
        markedDates[dueDate] = {
          ...markedDates[dueDate],
          dots: [{ color: '#FF3B30' }]
        };
      } else {
        markedDates[dueDate] = {
          marked: true,
          dots: [{ color: '#FF3B30' }]
        };
      }
    });

    return markedDates;
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem('loggedInUser');
      await AsyncStorage.removeItem('userRole');
      setShowLogoutModal(false);
      router.replace("/");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <View style={styles.navIcons}>
          
          <TouchableOpacity 
            style={styles.datePill}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#4a5568" style={styles.calendarIcon} />
            <View>
              <Text style={styles.dayText}>{selectedDate.toLocaleDateString("en-US", { weekday: "long" })}</Text>
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </View>
          </TouchableOpacity>
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
          <TouchableOpacity 
            style={styles.avatarIcon}
            onPress={() => profilePicture && setShowProfilePicModal(true)}
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person" size={40} color="#007AFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{username || 'User'}</Text>
          <View style={[styles.roleTag, styles.teacherRoleTag]}>
            <Text style={[styles.roleTagText, styles.teacherRoleText]}>Teacher</Text>
          </View>
          <Text style={styles.userEmail}>{emailAddress}</Text>
        </View>

        <View style={styles.drawerDivider} />

        <TouchableOpacity 
          style={[styles.drawerItem, pathname.includes("teacher") && styles.activeDrawerItem]} 
          onPress={() => router.push("/(teacher)/teacher")}
        >
          <Ionicons name="home-outline" size={24} color={pathname.includes("teacher") ? "white" : "#666"} />
          <Text style={[styles.drawerText, pathname.includes("teacher") && styles.activeDrawerText]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem} 
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.drawerText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.drawerItem, pathname === "/help" && styles.activeDrawerItem]} 
          onPress={() => router.push("/help")}
        >
          <Ionicons name="help-circle-outline" size={24} color={pathname === "/help" ? "white" : "#666"} />
          <Text style={[styles.drawerText, pathname === "/help" && styles.activeDrawerText]}>Help</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {showSuccessModal && (
          <Modal transparent={true} visible={showSuccessModal}>
            <View style={styles.toastContainer}>
              <View style={styles.toastContent}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.toastText}>{successMessage}</Text>
              </View>
            </View>
          </Modal>
        )}

        <Modal
          transparent={true}
          visible={showSettingsModal}
          onRequestClose={() => setShowSettingsModal(false)}
          animationType="fade"
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setShowSettingsModal(false)}
          >
            <TouchableOpacity 
              style={styles.settingsModal} 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Settings</Text>
                <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.settingsContent}>
                {/* Profile Picture Section */}
                <View style={styles.profileSection}>
                  <View style={styles.avatarContainer}>
                    <TouchableOpacity>
                      {profilePicture ? (
                        <Image source={{ uri: profilePicture }} style={styles.modalProfileImage} />
                      ) : (
                        <View style={styles.profileImagePlaceholder}>
                          <Ionicons name="person" size={40} color="#666" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.editIconOverlay}
                      onPress={() => setShowImageActionModal(true)}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                </View>
        
                {/* Username Section */}
                {isEditingUsername ? (
                  <View style={styles.editSection}>
                    <TextInput
                      style={styles.settingsInput}
                      value={newUsername}
                      onChangeText={setNewUsername}
                      placeholder="Enter new username"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity onPress={handleUpdateUsername} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsEditingUsername(false)} style={[styles.editButton, styles.cancelButton]}>
                        <Text style={styles.editButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.settingsItem} 
                    onPress={() => {
                      setNewUsername(username || "");
                      setIsEditingUsername(true);
                    }}
                  >
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <Text style={styles.settingsText}>Change Username</Text>
                  </TouchableOpacity>
                )}
        
                {/* Email Section */}
                {isEditingEmail ? (
                  <View style={styles.editSection}>
                    <TextInput
                      style={styles.settingsInput}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="Enter new email"
                      keyboardType="email-address"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity onPress={handleUpdateEmail} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsEditingEmail(false)} style={[styles.editButton, styles.cancelButton]}>
                        <Text style={styles.editButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.settingsItem}
                    onPress={() => {
                      setNewEmail(emailAddress);
                      setIsEditingEmail(true);
                    }}
                  >
                    <Ionicons name="mail-outline" size={24} color="#666" />
                    <Text style={styles.settingsText}>Change Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
        
        {/* Add Image Action Modal */}
        <Modal
          transparent={true}
          visible={showImageActionModal}
          animationType="fade"
          onRequestClose={() => setShowImageActionModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setShowImageActionModal(false)}
          >
            <View style={styles.actionModal}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => {
                  setShowImageActionModal(false);
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

        {/* Add Profile Picture View Modal */}
        <Modal
          transparent={true}
          visible={showProfilePicModal}
          animationType="fade"
          onRequestClose={() => setShowProfilePicModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setShowProfilePicModal(false)}
          >
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>

        <Modal
          transparent={true}
          visible={showCalendar}
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setShowCalendar(false)}
          >
            <View style={styles.calendarModal}>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={getMarkedDates()}
                theme={{
                  todayTextColor: '#007AFF',
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#ffffff',
                  arrowColor: '#007AFF',
                  dotColor: '#FF3B30',
                  selectedDotColor: '#ffffff'
                }}
                markingType="multi-dot"
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          transparent={true}
          visible={showAssignmentsModal}
          animationType="fade"
          onRequestClose={() => setShowAssignmentsModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1} 
            onPress={() => setShowAssignmentsModal(false)}
          >
            <View style={styles.assignmentsModal}>
              <View style={styles.assignmentsModalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="calendar" size={24} color="#007AFF" />
                  <Text style={styles.assignmentsModalTitle}>
                    Due on {selectedDate.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowAssignmentsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {selectedDateAssignments.map((assignment, index) => (
                <View key={assignment._id} style={styles.assignmentItem}>
                  <View style={styles.assignmentTimelineContainer}>
                    <View style={styles.assignmentDot} />
                    {index !== selectedDateAssignments.length - 1 && (
                      <View style={styles.assignmentTimeline} />
                    )}
                  </View>
                  <View style={styles.assignmentDetails}>
                    <Text style={styles.assignmentTime}>
                      {new Date(assignment.dueDate).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <Text style={styles.assignmentDescription} numberOfLines={2}>
                      {assignment.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          transparent={true}
          visible={showLogoutModal}
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.logoutConfirmModal}>
              <View style={styles.logoutModalHeader}>
                <Ionicons name="alert-circle-outline" size={28} color="#FF3B30" />
                <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
              </View>
              
              <Text style={styles.logoutModalMessage}>
                Are you sure you want to log out?
              </Text>
              
              <View style={styles.logoutModalButtons}>
                <TouchableOpacity 
                  style={[styles.logoutModalButton, styles.cancelLogoutButton]} 
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelLogoutText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.logoutModalButton, styles.confirmLogoutButton]} 
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    left: 0,  // Change this lineg
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  emailEditContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    marginVertical: 5,
  },
  emailButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  emailButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  emailButtonText: {
    color: 'white',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  successText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingsContent: {
    gap: 15,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  settingsText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSection: {
    width: '100%',
    marginBottom: 15,
  },
  settingsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 0,
    width: '80%',
    maxWidth: 300,
    overflow: 'hidden',
  },
  actionButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  avatarContainer: {
    position: 'relative',
  },
  editIconOverlay: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: 'white',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  fullScreenImage: {
    width: '90%',
    height: '50%',
    borderRadius: 10,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  toastText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  assignmentsModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  assignmentsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  assignmentsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  assignmentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  assignmentTimelineContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 20,
  },
  assignmentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  assignmentTimeline: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  assignmentDetails: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignmentTime: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 6,
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  logoutConfirmModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  logoutModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 24,
    textAlign: 'center',
  },
  logoutModalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoutModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelLogoutButton: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confirmLogoutButton: {
    backgroundColor: '#FF3B30',
  },
  cancelLogoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  confirmLogoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
