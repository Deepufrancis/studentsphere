import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface Course {
  _id: string;
  courseName: string;
  teacher: string;
  description: string;
}

const CourseRegistrationScreen = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (storedUsername) {
          setUsername(storedUsername);
          fetchRegistrationStatus(storedUsername);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/courses`);
        if (!response.ok) throw new Error("Failed to fetch courses.");
        const data: Course[] = await response.json();
        setCourses(data);
        setFilteredCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchCourses();
  }, []);

  const fetchRegistrationStatus = async (user: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registrations/status/${user}`);
      if (!response.ok) throw new Error("Failed to fetch registration status.");
      const data = await response.json();
      setRegistrationStatus(data);
    } catch (error) {
      console.error("Error fetching registration status:", error);
    }
  };

  const handleRegister = async (courseId: string) => {
    if (!username) return;
    try {
      const response = await fetch(`${API_BASE_URL}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, courseId }),
      });

      if (!response.ok) throw new Error("Failed to send registration request.");

      fetchRegistrationStatus(username);
    } catch (error) {
      console.error("Error registering for course:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const status = registrationStatus[item._id] || "not_registered";

          return (
            <View style={styles.courseCard}>
              <Text style={styles.courseTitle}>{item.courseName}</Text>
              <Text style={styles.courseTeacher}>Teacher: {item.teacher}</Text>
              <Text style={styles.courseDescription}>{item.description}</Text>

              {status === "pending" ? (
                <TouchableOpacity style={styles.pendingButton} disabled>
                  <Text style={styles.pendingButtonText}>Pending</Text>
                </TouchableOpacity>
              ) : status === "registered" ? (
                <TouchableOpacity style={styles.registeredButton} disabled>
                  <Text style={styles.registeredButtonText}>Registered</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.registerButton} onPress={() => handleRegister(item._id)}>
                  <Text style={styles.registerButtonText}>Request</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  courseCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  courseTeacher: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: "#444",
    marginTop: 8,
  },
  registerButton: {
    marginTop: 10,
    backgroundColor: "#008060",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pendingButton: {
    marginTop: 10,
    backgroundColor: "#FFA500",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  pendingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registeredButton: {
    marginTop: 10,
    backgroundColor: "#008060",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  registeredButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CourseRegistrationScreen;
