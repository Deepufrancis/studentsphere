import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Button } from "react-native";
import { API_BASE_URL } from "../constants";

interface Course {
  id: string;
  courseName: string;
  teacher: string;
  description: string;
  schedule: string;
}

export default function SCourse() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [registeredCourses, setRegisteredCourses] = useState<string[]>([]);

  const fetchCourses = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (!response.ok) throw new Error("Failed to fetch courses.");
      const data: Course[] = await response.json();
      setCourses(data);
    } catch (err) {
      setError("Error fetching courses. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const toggleCourseDetails = (id: string) => {
    setExpandedCourseId((prev) => (prev === id ? null : id)); // Toggle expansion
  };

  const handleRegister = async (courseId: string) => {
    try {
      const isRegistered = registeredCourses.includes(courseId);
      const url = isRegistered
        ? `${API_BASE_URL}/unregister/${courseId}`
        : `${API_BASE_URL}/register/${courseId}`;

      const response = await fetch(url, { method: "POST" });

      if (!response.ok) throw new Error("Failed to update registration.");

      setRegisteredCourses((prev) =>
        isRegistered ? prev.filter((id) => id !== courseId) : [...prev, courseId]
      );
    } catch (error) {
      console.error("Error updating registration:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {error ? (
        <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleCourseDetails(item.id)}
              style={{
                backgroundColor: "#f8f9fa",
                padding: 16,
                marginBottom: 8,
                borderRadius: 8,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.courseName}</Text>
              <Text style={{ color: "gray" }}>Teacher: {item.teacher}</Text>

              {expandedCourseId === item.id && ( // Only show details for expanded course
                <View style={{ marginTop: 10 }}>
                  <Text>{item.description}</Text>
                  <Text style={{ fontStyle: "italic", color: "blue" }}>{item.schedule}</Text>
                  <Button
                    title={registeredCourses.includes(item.id) ? "Registered" : "Register"}
                    color={registeredCourses.includes(item.id) ? "green" : "blue"}
                    onPress={() => handleRegister(item.id)}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
