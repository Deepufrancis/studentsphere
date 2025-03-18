import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";

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
  teacher: string;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const router = useRouter();

  useEffect(() => {
    getLoggedInTeacher();
  }, []);

  useEffect(() => {
    if (loggedInUser) fetchCourses();
  }, [loggedInUser]);

  useEffect(() => {
    if (filteredCourses.length > 0) fetchAssignments();
  }, [filteredCourses]);

  useEffect(() => {
    let filtered = assignments;
    if (selectedCourse) {
      filtered = assignments.filter(a => a.courseId === selectedCourse);
    }
    if (sortOrder === "asc") {
      filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }
    setFilteredAssignments([...filtered]);
  }, [assignments, selectedCourse, sortOrder]);

  const getLoggedInTeacher = async () => {
    const teacher = await AsyncStorage.getItem("loggedInUser");
    setLoggedInUser(teacher);
  };

  const fetchCourses = async () => {
    const response = await fetch(`${API_BASE_URL}/courses`);
    const data = await response.json();
    const teacherCourses = data.filter((course: Course) => course.teacher === loggedInUser);
    setCourses(data);
    setFilteredCourses(teacherCourses);
  };

  const fetchAssignments = async () => {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/assignments`);
    const data = await response.json();
    const teacherAssignments = data.filter((a: Assignment) =>
      filteredCourses.some(course => course._id === a.courseId)
    );
    setAssignments(teacherAssignments);
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assignments</Text>

      {/* Course Filter */}
      <Picker selectedValue={selectedCourse} onValueChange={setSelectedCourse}>
        <Picker.Item label="All Courses" value="" />
        {filteredCourses.map(course => (
          <Picker.Item key={course._id} label={course.courseName} value={course._id} />
        ))}
      </Picker>

      {/* Sorting Button */}
      <View style={styles.sortButtonContainer}>
        <Button
          title={sortOrder === "asc" ? "Sort by Newest" : "Sort by Oldest"}
          onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        />
      </View>

      {/* Assignments List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const course = filteredCourses.find(course => course._id === item.courseId);
          return (
            <TouchableOpacity
              style={styles.assignmentCard}
              onPress={() =>
                router.push({
                  pathname: "/assignment-details",
                  params: {
                    id: item._id,
                    title: item.title,
                    description: item.description,
                    dueDate: item.dueDate,
                    course: course?.courseName || "Unknown",
                  },
                })
              }
            >
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentDescription}>{item.description}</Text>
              <Text style={styles.assignmentDate}>Due: {new Date(item.dueDate).toDateString()}</Text>
              <Text style={styles.assignmentCourse}>Course: {course ? course.courseName : "Unknown"}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  sortButtonContainer: { marginVertical: 10 },
  assignmentCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  assignmentTitle: { fontSize: 18, fontWeight: "bold" },
  assignmentDescription: { fontSize: 14 },
  assignmentDate: { fontSize: 12, color: "gray" },
  assignmentCourse: { fontSize: 14, fontWeight: "bold" },
});

