import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface Course {
  _id: string;
  courseName: string;
  teacher: string;
  description: string;
}

const CourseRegistrationScreen = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<{ [key: string]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          setUsername(storedUsername);
          fetchRegistrationStatus(storedUsername);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) throw new Error("Failed to fetch courses.");
        const data: Course[] = await response.json();
        setCourses(data);
        setFilteredCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchCourses();
  }, []);

  const fetchRegistrationStatus = async (user: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registrations/status/${user}`);
      if (!response.ok) throw new Error("Failed to fetch registration status.");
      const data = await response.json();
      setRegistrationStatus(data);
    } catch (error) {
      console.error("Error fetching registration status:", error);
    }
  };

  const handleRegister = async (courseId: string) => {
    if (!username) return;
    try {
      const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, courseId }),
      });

      if (!response.ok) throw new Error("Failed to send registration request.");

      fetchRegistrationStatus(username);
    } catch (error) {
      console.error("Error registering for course:", error);
    }
  };

  const handleCancel = async (courseId: string) => {
    setSelectedCourse(courseId);
    setModalVisible(true);
  };

  const confirmCancel = async () => {
    if (!username || !selectedCourse) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/registrations/cancel/${username}/${selectedCourse}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to cancel registration.");
      fetchRegistrationStatus(username);
    } catch (error) {
      console.error("Error cancelling registration:", error);
    } finally {
      setModalVisible(false);
      setSelectedCourse(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Available Courses</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setInfoModalVisible(true)}
        >
          <Text style={styles.infoButtonText}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const status = registrationStatus[item._id] || "not_registered";

          return (
            <View style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{item.courseName}</Text>
                <Text style={styles.statusBadge(status as 'registered' | 'pending' | 'not_registered')}>
                  {status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.courseTeacher}>Teacher: {item.teacher}</Text>
              <Text style={styles.courseDescription}>{item.description}</Text>

              <View style={styles.buttonContainer}>
                {status === "pending" ? (
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => handleCancel(item._id)}
                  >
                    <Text style={styles.buttonText}>Cancel Request</Text>
                  </TouchableOpacity>
                ) : status === "registered" ? (
                  <View style={styles.registeredBadge}>
                    <Text style={styles.registeredButtonText}>Enrolled</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.registerButton} 
                    onPress={() => handleRegister(item._id)}
                  >
                    <Text style={styles.buttonText}>Request Enrollment</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Course Registration</Text>
            <Text style={styles.modalText}>
              Welcome to the course registration page! Here you can:
              {'\n\n'}• Browse available courses
              {'\n'}• Request enrollment in courses
              {'\n'}• View your registration status
              {'\n'}• Cancel pending registration requests
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { width: '100%', backgroundColor: '#2ecc71' }]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Registration</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel your registration request?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>No, Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmCancel}
              >
                <Text style={styles.modalButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  infoButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },
  infoButtonText: {
    fontSize: 24,
    color: '#3498db',
    fontWeight: 'bold',
  },
  courseCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  statusBadge: (status: 'registered' | 'pending' | 'not_registered') => ({
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: status === "registered" ? "#e6f7ee" : 
                    status === "pending" ? "#fff8e6" : "#f5f5f5",
    color: status === "registered" ? "#27ae60" : 
           status === "pending" ? "#f39c12" : "#7f8c8d",
  }),
  courseTeacher: {
    fontSize: 15,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registeredBadge: {
    backgroundColor: "#27ae60",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  registeredButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  modalText: {
    fontSize: 16,
    color: "#34495e",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },
  modalCancelButton: {
    backgroundColor: "#95a5a6",
  },
  modalConfirmButton: {
    backgroundColor: "#e74c3c",
  },
  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CourseRegistrationScreen;
