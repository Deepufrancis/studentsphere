import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface Course {
  _id: string;
  courseName: string;
  description: string;
  teacher: string;
}

export default function StudentCourseScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredCourses, setRegisteredCourses] = useState<string[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentIdAndCourses = async () => {
      try {
        const id = await AsyncStorage.getItem("studentId");
        if (!id) return;
        setStudentId(id);

        const [coursesRes, registrationsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/courses"),
          axios.get(`http://localhost:5000/api/registrations/${id}`)
        ]);

        setCourses(coursesRes.data);
        setRegisteredCourses(registrationsRes.data.map((reg: any) => reg.courseId));
      } catch (error) {
        Alert.alert("Error", "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentIdAndCourses();
  }, []);

  const handleRegister = async (courseId: string) => {
    if (!studentId) return;

    try {
      if (registeredCourses.includes(courseId)) {
        setRegisteredCourses((prev) => prev.filter((id) => id !== courseId));
        await axios.delete(`http://localhost:5000/api/register/${courseId}/${studentId}`);
        Alert.alert("Success", "Registration canceled.");
      } else {
        setRegisteredCourses((prev) => [...prev, courseId]);
        await axios.post("http://localhost:5000/api/register", { studentId, courseId });
        Alert.alert("Success", "Registered successfully.");
      }
    } catch {
      Alert.alert("Error", "Failed to update registration.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15, padding: 10, borderWidth: 1, borderRadius: 5 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.courseName}</Text>
              <Text>{item.description}</Text>
              <Text style={{ fontStyle: "italic" }}>Teacher: {item.teacher}</Text>
              <Button
                title={registeredCourses.includes(item._id) ? "Cancel" : "Register"}
                color={registeredCourses.includes(item._id) ? "red" : "green"}
                onPress={() => handleRegister(item._id)}
              />
            </View>
          )}
        />
      ) : (
        <Text>No courses available</Text>
      )}
    </View>
  );
}
