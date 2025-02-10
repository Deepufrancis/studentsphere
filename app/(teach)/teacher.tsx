import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, StyleSheet } from "react-native";
import axios from "axios";

interface Course {
  _id: string;
  courseName: string;
  description: string;
}

const Teacher: React.FC = () => {
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/courses");
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

    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse._id}`, {
          courseName,
          description,
        });
        setSuccess("Course updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/courses", { courseName, description });
        setSuccess("Course added successfully!");
      }

      setCourseName("");
      setDescription("");
      setIsModalOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      setError("Error saving course. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`);
      fetchCourses();
    } catch (error) {
      setError("Error deleting course.");
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.courseName);
    setDescription(course.description);
    setIsModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Course List</Text>
      {loading && <Text>Loading courses...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && courses.length === 0 && <Text>No courses available.</Text>}

      <ScrollView style={styles.courseList}>
        {courses.map((course) => (
          <View key={course._id} style={styles.courseCard}>
            <Text style={styles.courseTitle}>{course.courseName}</Text>
            <Text>{course.description}</Text>
            <TouchableOpacity onPress={() => openEditModal(course)} style={styles.editButton}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(course._id)} style={styles.deleteButton}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => {
          setEditingCourse(null);
          setCourseName("");
          setDescription("");
          setIsModalOpen(true);
        }}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCourse ? "Edit Course" : "Add Course"}</Text>
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
              <Text style={styles.buttonText}>{editingCourse ? "Update" : "Add"} Course</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Teacher;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  courseList: { flex: 1 },
  courseCard: { backgroundColor: "#fff", padding: 15, marginVertical: 5, borderRadius: 8 },
  courseTitle: { fontSize: 18, fontWeight: "bold" },
  editButton: { backgroundColor: "blue", padding: 10, marginTop: 5, borderRadius: 5 },
  deleteButton: { backgroundColor: "red", padding: 10, marginTop: 5, borderRadius: 5 },
  addButton: {
    position: "absolute",
    bottom: 80, // Adjusted to stay above bottom tab
    right: 20,
    backgroundColor: "#007BFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Adds shadow on Android
    shadowColor: "#000", // Adds shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
