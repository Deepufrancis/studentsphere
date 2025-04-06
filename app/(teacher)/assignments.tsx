import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Button,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.courseFilterScroll}
      >
        <TouchableOpacity
          style={[
            styles.coursePill,
            selectedCourse === "" && styles.selectedCoursePill
          ]}
          onPress={() => setSelectedCourse("")}
        >
          <Text style={[
            styles.coursePillText,
            selectedCourse === "" && styles.selectedPillText
          ]}>All Courses</Text>
        </TouchableOpacity>
        {filteredCourses.map(course => (
          <TouchableOpacity
            key={course._id}
            style={[
              styles.coursePill,
              selectedCourse === course._id && styles.selectedCoursePill
            ]}
            onPress={() => setSelectedCourse(course._id)}
          >
            <Text style={[
              styles.coursePillText,
              selectedCourse === course._id && styles.selectedPillText
            ]}>{course.courseName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sorting Button */}
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              sortOrder === "asc" && styles.segmentedButtonActive,
              { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
            ]}
            onPress={() => setSortOrder("asc")}
          >
            <Text style={[
              styles.segmentedButtonText,
              sortOrder === "asc" && styles.segmentedButtonTextActive
            ]}>Sort by Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentedButton,
              sortOrder === "desc" && styles.segmentedButtonActive,
              { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
            ]}
            onPress={() => setSortOrder("desc")}
          >
            <Text style={[
              styles.segmentedButtonText,
              sortOrder === "desc" && styles.segmentedButtonTextActive
            ]}>Sort by Newest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Assignments List */}
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const course = filteredCourses.find(course => course._id === item.courseId);
          return (
            <View style={styles.assignmentCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() =>
                  router.push({
                    pathname: "/(teacher)/assignment-details",
                    params: {
                      id: item._id,
                      title: item.title,
                      description: item.description,
                      dueDate: item.dueDate,
                      course: course?.courseName || "Unknown",
                      courseId: item.courseId,
                    },
                  })
                }
              >
                <Text style={styles.assignmentTitle}>{item.title}</Text>
                <Text style={styles.assignmentDescription}>{item.description}</Text>
                <Text style={styles.assignmentDate}>Due: {new Date(item.dueDate).toDateString()}</Text>
                <Text style={styles.assignmentCourse}>Course: {course ? course.courseName : "Unknown"}</Text>
              </TouchableOpacity>
            </View>
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
  cardContent: {
    flex: 1,
  },
  courseFilterScroll: {
    flexGrow: 0,
    marginBottom: 15,
  },
  coursePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
    marginRight: 8,
  },
  selectedCoursePill: {
    backgroundColor: '#007AFF',
  },
  coursePillText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedPillText: {
    color: '#fff',
  },
  segmentedControlContainer: {
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: '#fff',
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  segmentedButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedButtonTextActive: {
    color: '#007AFF',
  },
});

