import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";

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
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);

    if (!username) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/courses`, {
        courseName,
        description,
        teacher: username,
      });
      setSuccess("Course added successfully!");
      setCourseName("");
      setDescription("");
      setIsModalOpen(false);
      fetchCourses(username);
    } catch (error) {
      setError("Error adding course. Please try again.");
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search Courses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

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
            <Text style={styles.courseTitle}>{course.courseName}</Text>
            <Text>{course.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => {
          setCourseName("");
          setDescription("");
          setIsModalOpen(true);
        }}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Course</Text>
            {success && <Text style={styles.success}>{success}</Text>}
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  courseList: { flex: 1 },
  courseCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 5,
    borderColor: "black",
    borderWidth: 1,
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
  searchInput: { 
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10
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
  success: { color: "green", marginBottom: 10 },
});
