import { View, Text, TouchableOpacity, TextInput, Modal, Alert ,FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../constants";

interface Course {
  _id: string;
  courseName: string;
  description: string;
}

interface Student {
  _id: string;
  username: string;
}

export default function CourseDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedCourseName, setUpdatedCourseName] = useState("");
  const [updatedDescription, setUpdatedDescription] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    if (!id || id.toString().length !== 24) {
      console.error("Invalid Course ID detected:", id);
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCourse(data);
        setUpdatedCourseName(data.courseName);
        setUpdatedDescription(data.description);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching course:", err);
        setLoading(false);
      });
  }, [id]);



  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reg_students/${id}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");

      const data = await res.json();
      setStudents(data);
      setIsStudentModalOpen(true);
    } catch (error) {
      Alert.alert("Error", "Could not fetch students.");
    }
  };

  const handleUpdate = async () => {
    try {
      await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: updatedCourseName,
          description: updatedDescription,
        }),
      });
      setCourse((prev) => prev ? { ...prev, courseName: updatedCourseName, description: updatedDescription } : null);
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update course");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Course", "Are you sure you want to delete this course?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/courses/${id}`, { method: "DELETE" });
            router.replace("/courses");
          } catch (error) {
            Alert.alert("Error", "Failed to delete course");
          }
        },
      },
    ]);
  };

  if (loading) return <Text>Loading...</Text>;
  if (!course) return <Text>Course not found</Text>;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
      <View style={{ 
        width: "90%", 
        backgroundColor: "#fff", 
        padding: 20, 
        borderRadius: 12, 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 5 
      }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>{course.courseName}</Text>
        <Text style={{ fontSize: 16, color: "#555", marginBottom: 12 }}>ID: {course._id}</Text>
        <Text style={{ fontSize: 16, marginBottom: 12 }}>{course.description}</Text>


        <TouchableOpacity 
          style={{ backgroundColor: "#17a2b8", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 }}
          onPress={fetchStudents}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>View Registered Students</Text>
        </TouchableOpacity>
      
  
        <TouchableOpacity 
          style={{
            backgroundColor: "#007bff", 
            paddingVertical: 12, 
            borderRadius: 8, 
            alignItems: "center",
            marginBottom: 10
          }} 
          onPress={() => router.push(`/assignment/${course._id}`)}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ backgroundColor: "#28a745", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 }}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Edit Course</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ backgroundColor: "#dc3545", paddingVertical: 12, borderRadius: 8, alignItems: "center" }}
          onPress={handleDelete}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>Delete Course</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isStudentModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "80%", padding: 20, backgroundColor: "#fff", borderRadius: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Registered Students</Text>

            {students.length > 0 ? (
              <FlatList
                data={students}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <Text style={{ fontSize: 16, paddingVertical: 5 }}>{item.username}</Text>
                  
                  
                )}
              />
            ) : (
              <Text>No students registered yet.</Text>
            )}

            <TouchableOpacity onPress={() => setIsStudentModalOpen(false)} style={{ backgroundColor: "gray", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ width: "80%", padding: 20, backgroundColor: "#fff", borderRadius: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Edit Course</Text>
            <TextInput
              style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
              value={updatedCourseName}
              onChangeText={setUpdatedCourseName}
            />
            <TextInput
              style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
              value={updatedDescription}
              onChangeText={setUpdatedDescription}
            />
            <TouchableOpacity onPress={handleUpdate} style={{ backgroundColor: "#007bff", padding: 10, borderRadius: 5, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Update Course</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsModalOpen(false)} style={{ backgroundColor: "gray", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
