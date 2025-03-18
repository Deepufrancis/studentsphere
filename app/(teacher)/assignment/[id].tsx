import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../../constants";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
}

interface Course {
  _id: string;
  courseName: string;
}

export default function AssignmentPage() {
  const { id: courseId } = useLocalSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courseName, setCourseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());

  useEffect(() => {
    if (!courseId) {
      setError("Course ID not found");
      setLoading(false);
      return;
    }
    fetchCourseDetails();
    fetchAssignments();
  }, [courseId]);

  const fetchCourseDetails = () => {
    fetch(`${API_BASE_URL}/courses/${courseId}`)
      .then((response) => response.json())
      .then((data: Course) => setCourseName(data.courseName))
      .catch(() => setError("Error fetching course details"));
  };

  const fetchAssignments = () => {
    fetch(`${API_BASE_URL}/assignments?courseId=${courseId}`)
      .then((response) => response.json())
      .then((data) => {
        const filteredAssignments = data.filter(
          (assignment: Assignment) => assignment.courseId === courseId
        );
        setAssignments(filteredAssignments);
      })
      .catch(() => setError("Error fetching assignments"))
      .finally(() => setLoading(false));
  };

  const addAssignment = () => {
    const dueDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    fetch(`${API_BASE_URL}/assignments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        dueDate,
        courseId,
        courseName,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setModalVisible(false);
        fetchAssignments();
      })
      .catch(() => alert("Failed to add assignment"));
  };

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.courseTitle}>{courseName}</Text>
      <Text style={styles.header}>Assignments</Text>
      {assignments.length === 0 && <Text>No assignments found</Text>}
      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.assignmentCard}>
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <Text style={styles.assignmentDescription}>{item.description}</Text>

            <Text style={styles.assignmentDate}>
              Due Date: {new Date(item.dueDate).toISOString().split("T")[0]}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Assignment</Text>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            multiline
          />
          <View style={styles.dateContainer}>
            <TextInput
              placeholder="DD"
              value={day.toString()}
              onChangeText={(text) => setDay(parseInt(text) || day)}
              style={styles.dateInput}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="MM"
              value={month.toString()}
              onChangeText={(text) => setMonth(parseInt(text) || month)}
              style={styles.dateInput}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="YYYY"
              value={year.toString()}
              onChangeText={(text) => setYear(parseInt(text) || year)}
              style={styles.dateInput}
              keyboardType="numeric"
            />
          </View>
          <Button title="Add Assignment" onPress={addAssignment} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f2f5" },
  courseTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  assignmentCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  assignmentDescription: { fontSize: 14, color: "#555", marginBottom: 5 },
  assignmentDate: { fontSize: 12, color: "#777" },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007bff",
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  addButtonText: { fontSize: 30, color: "white" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
});
