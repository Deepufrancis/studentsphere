import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface RegistrationRequest {
  _id: string;
  username: string;
  course: { _id: string; courseName: string };
}

const TeacherApprovalScreen = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherUsername, setTeacherUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherRequests = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("loggedInUser");
        if (!storedUsername) return;

        setTeacherUsername(storedUsername);
        const response = await fetch(`${API_BASE_URL}/registrations/pending/${storedUsername}`);
        if (!response.ok) throw new Error("Failed to fetch pending requests.");
        
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherRequests();
  }, []);

  const handleApproval = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/registrations/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: id }),
      });
      
      // Create notification for student
      await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: requests.find(req => req._id === id)?.username,
          message: `Your registration for ${requests.find(req => req._id === id)?.course.courseName} has been approved`,
          type: "approval"
        }),
      });
      
      setRequests(requests.filter((req) => req._id !== id));
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleRejection = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/registrations/reject/${id}`, { method: "DELETE" });
      
      // Create notification for student
      await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: requests.find(req => req._id === id)?.username,
          message: `Your registration for ${requests.find(req => req._id === id)?.course.courseName} has been rejected`,
          type: "rejection"
        }),
      });
      
      setRequests(requests.filter((req) => req._id !== id));
    } catch (error) {
      console.error("Error rejecting request:", error);
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
      {requests.length === 0 ? (
        <Text style={styles.noRequestsText}>No pending requests</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <Text style={styles.courseText}>{item.course.courseName}</Text>
              <Text style={styles.usernameText}>Student: {item.username}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.approveButton} onPress={() => handleApproval(item._id)}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejection(item._id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noRequestsText: { fontSize: 18, textAlign: "center", marginTop: 20 },
  requestCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  usernameText: { fontSize: 14, color: "#666", marginTop: 4 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  approveButton: { backgroundColor: "#008000", padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
  rejectButton: { backgroundColor: "#FF0000", padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});

export default TeacherApprovalScreen;
