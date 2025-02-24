import React, { useState, useEffect,useLayoutEffect } from "react";
import { 
  View, Text, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, StyleSheet 
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../constants";

interface Course {
  _id: string;
  courseName: string;
  description: string;
  teacher: string;
}

const CourseDetails = () => {
  const { id: courseId } = useLocalSearchParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const navigation=useNavigation();

  useEffect(() => {
    const fetchCourseById = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
        setCourse(response.data);
        setCourseName(response.data.courseName);
        setDescription(response.data.description);
      } catch (err) {
        setError("Failed to fetch course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseById();
    }
  }, [courseId]);

  useLayoutEffect(() => {
    if (course) {
      navigation.setOptions({ title: course.courseName });
    }
  }, [navigation, course]);

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_BASE_URL}/courses/${courseId}`, {
        courseName,
        description,
      });
      setCourse((prev) => (prev ? { ...prev, courseName, description } : null));
      setIsModalOpen(false);
      Alert.alert("Success", "Course updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update course.");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Course", "Are you sure you want to delete this course?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
            router.replace("/courses"); // Go back to course list after deletion
          } catch (error) {
            Alert.alert("Error", "Failed to delete course.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : course ? (
        <>
          <Text style={styles.courseTitle}>{course.courseName}</Text>
          <Text style={styles.description}>{course.description}</Text>

          <TouchableOpacity onPress={() => setIsModalOpen(true)} style={styles.editButton}>
            <Text style={styles.buttonText}>Edit Course</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.buttonText}>Delete Course</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={()=>router.push(`/assignments?courseId=${courseId}`)}><Text style={styles.buttonText}>Assignments</Text></TouchableOpacity>

          <Modal visible={isModalOpen} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Course</Text>
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
                <TouchableOpacity onPress={handleUpdate} style={styles.modalButton}>
                  <Text style={styles.buttonText}>Update Course</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text>No course found.</Text>
      )}
    </View>
  );
};

export default CourseDetails;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  courseTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 16, marginBottom: 20 },
  editButton: { backgroundColor: "blue", padding: 10, borderRadius: 5, alignItems: "center", marginBottom: 10 },
  deleteButton: { backgroundColor: "red", padding: 10, borderRadius: 5, alignItems: "center",marginBottom:10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", padding: 20, backgroundColor: "#fff", borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  modalButton: { backgroundColor: "blue", padding: 10, borderRadius: 5, alignItems: "center" },
  closeButton: { backgroundColor: "gray", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  error: { color: "red", marginBottom: 10 },
});
