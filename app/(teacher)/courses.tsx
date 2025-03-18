import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ToastAndroid,
  Image,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

interface Course {
  _id: string;
  courseName: string;
  description: string;
  teacher: string;
}

const TeacherCourses: React.FC = () => {
  const [username, setUsername] = useState("");
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      const storedUser = await AsyncStorage.getItem("loggedInUser");
      if (storedUser) {
        setUsername(storedUser);
        fetchCourses(storedUser);
      }
    };

    fetchUsername();
  }, []);

  const fetchCourses = async (teacherUsername: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses?teacher=${teacherUsername}`
      );
      setCourses(response.data);
    } catch (err) {
      setError("Failed to fetch courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!username) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/courses`, {
        courseName,
        description,
        teacher: username,
      });
      ToastAndroid.show('Course added successfully!', ToastAndroid.SHORT);
      setCourseName("");
      setDescription("");
      setIsModalOpen(false);
      fetchCourses(username);
    } catch (error) {
      ToastAndroid.show('Error adding course. Please try again.', ToastAndroid.SHORT);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.usernameText}>{username}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Your Courses..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && <Text>Loading courses...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && filteredCourses.length === 0 && (
        <Text>No courses found.</Text>
      )}

      <ScrollView style={styles.courseList}>
        {filteredCourses.map((course) => (
          <TouchableOpacity
            key={course._id}
            onPress={() => router.push(`/course/${course._id}`)}
            style={styles.courseCard}
          >
            <View style={styles.courseContent}>
              <Text style={styles.courseTitle}>{course.courseName}</Text>
              <Text>{course.description}</Text>
            </View>
            <View style={styles.forwardButton}>
              <Ionicons name="chevron-forward" size={24} color="#007BFF" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalOpen(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Course</Text>
            <TextInput
              style={styles.input}
              placeholder="Course Name"
              value={courseName}
              onChangeText={setCourseName}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.modalButton}>
              <Text style={styles.buttonText}>Add Course</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsModalOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeacherCourses;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  welcomeContainer: {
    marginBottom: 20,
    paddingVertical: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 2,
  },
  courseList: { flex: 1 },
  courseCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 5,
    borderColor: "black",
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseContent: {
    flex: 1,
    marginRight: 10,
  },
  forwardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007BFF',
  },
  courseTitle: { fontSize: 18, fontWeight: "bold" },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007BFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 15,
    height: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  searchInput: { 
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
    paddingVertical: 8,
  },
  addButtonText: { fontSize: 30, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", padding: 20, backgroundColor: "#fff", borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  modalButton: { backgroundColor: "blue", padding: 10, borderRadius: 5, alignItems: "center" },
  closeButton: { backgroundColor: "gray", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: { color: "red", marginBottom: 10 },
});
