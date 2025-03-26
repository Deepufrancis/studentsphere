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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

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

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const date = new Date(assignment.dueDate);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setDay(date.getDate());
    setEditModalVisible(true);
  };

  const handleDelete = async (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAssignments();
      } else {
        alert('Failed to delete assignment');
      }
    } catch (error) {
      alert('Error deleting assignment');
    }
    setDeleteModalVisible(false);
    setAssignmentToDelete(null);
  };

  const updateAssignment = async () => {
    if (!selectedAssignment) return;

    const dueDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${selectedAssignment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate }),
      });

      if (response.ok) {
        setEditModalVisible(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        alert('Failed to update assignment');
      }
    } catch (error) {
      alert('Error updating assignment');
    }
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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

      <Modal visible={editModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Assignment</Text>
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
          <Button title="Update Assignment" onPress={updateAssignment} />
          <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
        </View>
      </Modal>

      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Confirm Delete</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this assignment?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.deleteModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteModalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  deleteModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#dc3545',
  },
  deleteModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
