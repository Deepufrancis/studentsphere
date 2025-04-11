import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, StyleSheet, Animated, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface Course {
  _id: string;
  courseName: string;
  teacher: string;
  description: string;
}

type FilterOption = "all" | "approved" | "pending" | "not_registered";

const CourseRegistrationScreen = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<{ [key: string]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterOption>("all");
  const filterAnimation = useRef(new Animated.Value(0)).current;
  
  const screenWidth = Dimensions.get('window').width;
  const segmentWidth = (screenWidth - 40) / 4; // 40 for padding

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

  useEffect(() => {
    if (currentFilter === "all") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => {
        const status = (registrationStatus[course._id] || "not_registered").trim().toLowerCase();
        return status === currentFilter;
      });
      setFilteredCourses(filtered);
    }
  }, [currentFilter, courses, registrationStatus]);

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
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username, 
          courseId,
          // Only include required fields
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || "Failed to send registration request.";
        throw new Error(errorMessage);
      }

      await fetchRegistrationStatus(username);
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel registration");
      }
      
      fetchRegistrationStatus(username);
    } catch (error) {
      console.error("Error cancelling registration:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setModalVisible(false);
      setSelectedCourse(null);
    }
  };

  const animateFilter = (index: number) => {
    Animated.spring(filterAnimation, {
      toValue: index,
      tension: 300,
      friction: 30,
      useNativeDriver: true,
    }).start();
  };

  const handleFilterChange = (filter: FilterOption, index: number) => {
    setCurrentFilter(filter);
    animateFilter(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Available Courses</Text>
        <TouchableOpacity 
          style={styles.infoButtonContainer} 
          onPress={() => setInfoModalVisible(true)}
        >
          <Text style={styles.infoButton}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <Animated.View 
          style={[
            styles.filterIndicator, 
            { 
              transform: [{ 
                translateX: filterAnimation.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3]
                }) 
              }] 
            }
          ]} 
        />
        {["all", "approved", "pending", "not_registered"].map((filter, index) => (
          <TouchableOpacity 
            key={filter}
            style={styles.filterOption} 
            onPress={() => handleFilterChange(filter as FilterOption, index)}
          >
            <Text style={[
              styles.filterText,
              currentFilter === filter && styles.activeFilterText
            ]}>
              {filter.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredCourses.length === 0 ? (
        <View style={styles.emptyCourseContainer}>
          <Text style={styles.emptyCoursesText}>No courses found for this filter</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const rawStatus = registrationStatus[item._id] || "not_registered";
            const status = rawStatus.trim().toLowerCase();

            return (
              <View style={styles.courseItem}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName} numberOfLines={2}>{item.courseName}</Text>
                  <View style={[
                    styles.statusContainer,
                    status === "approved" && styles.approvedContainer,
                    status === "pending" && styles.pendingContainer,
                    status === "not_registered" && styles.notRegisteredContainer
                  ]}>
                    <Text style={[
                      styles.statusText,
                      status === "approved" && styles.approvedText,
                      status === "pending" && styles.pendingText,
                      status === "not_registered" && styles.notRegisteredText
                    ]}>{status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Text>
                  </View>
                </View>
                <Text style={styles.teacherName} numberOfLines={1}>Teacher: {item.teacher}</Text>
                <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

                <View style={styles.buttonContainer}>
                  {status === "pending" ? (
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => handleCancel(item._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : status === "approved" ? (
                    <View style={styles.enrolledContainer}>
                      <Text style={styles.enrolledText}>✓ Enrolled</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.enrollButton} 
                      onPress={() => handleRegister(item._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.enrollButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Course Registration</Text>
            <Text style={styles.modalText}>
              Welcome to the course registration page! Here you can:
              {'\n\n'}• Browse available courses
              {'\n'}• Request enrollment in courses
              {'\n'}• View your registration status
              {'\n'}• Cancel pending registration requests
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setInfoModalVisible(false)}
              activeOpacity={0.7}
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Registration</Text>
            <Text style={styles.modalText}>Are you sure you want to cancel your registration request?</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]} 
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonSecondaryText}>No, Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonDanger]} 
                onPress={confirmCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!errorMessage}
        onRequestClose={() => setErrorMessage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setErrorMessage(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  infoButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  infoButton: {
    fontSize: 20,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 20,
    position: 'relative',
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filterIndicator: {
    position: 'absolute',
    width: '25%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 8,
    top: '5%',
    left: '0.5%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  filterOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
  },
  activeFilterText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  emptyCourseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCoursesText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  courseItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    marginHorizontal: '1%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#2c3e50',
  },
  statusContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 2,
  },
  approvedContainer: {
    backgroundColor: '#4CAF50',
  },
  pendingContainer: {
    backgroundColor: '#FFC107',
  },
  notRegisteredContainer: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  approvedText: {
    color: 'white',
  },
  pendingText: {
    color: '#212529',
  },
  notRegisteredText: {
    color: 'white',
  },
  teacherName: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  enrollButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  enrollButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  enrolledContainer: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  enrolledText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
    color: '#495057',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  modalButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  modalButtonDanger: {
    backgroundColor: '#f44336',
    shadowColor: '#d32f2f',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalButtonSecondaryText: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default CourseRegistrationScreen;
