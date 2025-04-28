import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Button,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

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

  // Animation related state
  const toggleAnimation = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const toggleWidth = screenWidth - 60; // accounting for padding
  
  // Toggle animation function
  const animateToggle = (value: "asc" | "desc") => {
    Animated.spring(toggleAnimation, {
      toValue: value === "asc" ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    setSortOrder(value);
  };

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

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading assignments...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assignments</Text>

      {/* Course Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.courseFilterScroll}
        contentContainerStyle={styles.courseFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.coursePill,
            selectedCourse === "" && styles.selectedCoursePill
          ]}
          onPress={() => setSelectedCourse("")}
        >
          <LinearGradient
            colors={selectedCourse === "" ? ['#0085ff', '#0062cc'] : ['#ffffff', '#f5f9ff']}
            style={styles.pillGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[
              styles.coursePillText,
              selectedCourse === "" && styles.selectedPillText
            ]}>All Courses</Text>
          </LinearGradient>
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
            <LinearGradient
              colors={selectedCourse === course._id ? ['#0085ff', '#0062cc'] : ['#ffffff', '#f5f9ff']}
              style={styles.pillGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[
                styles.coursePillText,
                selectedCourse === course._id && styles.selectedPillText
              ]}>{course.courseName}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Animated Segmented Control */}
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          <Animated.View 
            style={[
              styles.segmentIndicator,
              {
                transform: [{
                  translateX: toggleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, toggleWidth / 2 - 2]
                  })
                }]
              }
            ]} 
          />
          <TouchableOpacity
            style={[styles.segmentedButton, { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]}
            onPress={() => animateToggle("asc")}
          >
            <Text style={[
              styles.segmentedButtonText,
              sortOrder === "asc" && styles.segmentedButtonTextActive
            ]}>Sort by Oldest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentedButton, { borderTopRightRadius: 8, borderBottomRightRadius: 8 }]}
            onPress={() => animateToggle("desc")}
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
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const course = filteredCourses.find(course => course._id === item.courseId);
          
          // Calculate days remaining
          const today = new Date();
          const dueDate = new Date(item.dueDate);
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysRemaining < 0;
          
          return (
            <Animated.View 
              style={[
                styles.assignmentCard,
                { 
                  opacity: 1, 
                  transform: [{ 
                    translateY: 0 
                  }] 
                }
              ]}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9ff']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <TouchableOpacity
                  style={styles.cardContent}
                  activeOpacity={0.7}
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
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{item.title}</Text>
                    <View style={styles.courseTag}>
                      <Text style={styles.courseTagText}>{course ? course.courseName : "Unknown"}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentDescription} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.dateContainer}>
                    <Text style={styles.assignmentDate}>Due: {new Date(item.dueDate).toDateString()}</Text>
                    {daysRemaining >= 0 ? (
                      <View style={styles.daysRemainingContainer}>
                        <Text style={styles.daysRemainingText}>
                          {daysRemaining === 0 ? "Due Today" : `${daysRemaining} days left`}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.overdueContainer}>
                        <Text style={styles.overdueText}>Overdue</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#f8f9fa" 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8f9fa"
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 20, 
    color: '#333',
    textAlign: "center" 
  },
  listContainer: {
    paddingBottom: 20,
  },
  courseFilterScroll: {
    flexGrow: 0,
    marginBottom: 20,
  },
  courseFilterContent: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  coursePill: {
    marginRight: 12,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  selectedCoursePill: {
    elevation: 5,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  pillGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  coursePillText: {
    color: '#0056b3',
    fontWeight: '600',
    fontSize: 14,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 0.5,
  },
  selectedPillText: {
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  segmentedControlContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 2,
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 44,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: 40,
    width: '49.5%',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentedButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedButtonTextActive: {
    color: '#007AFF',
  },
  assignmentCard: {
    marginVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    borderRadius: 18,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentTitle: { 
    fontSize: 18, 
    fontWeight: "700",
    flex: 1,
    color: '#2c3e50',
  },
  courseTag: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
  },
  courseTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  assignmentDescription: { 
    fontSize: 14,
    color: '#5d6d7e',
    marginBottom: 14,
    lineHeight: 22,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  assignmentDate: { 
    fontSize: 13, 
    color: "#667788",
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    padding: 18,
  },
  daysRemainingContainer: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysRemainingText: {
    color: '#27ae60',
    fontSize: 12,
    fontWeight: '700',
  },
  overdueContainer: {
    backgroundColor: 'rgba(231,76,60,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: '700',
  },
});

