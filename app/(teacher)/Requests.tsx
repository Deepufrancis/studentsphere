import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface RegistrationRequest {
  _id: string;
  studentId: string;  // Add this
  username: string;
  course: { 
    _id: string; 
    courseName: string 
  };
}

const TeacherApprovalScreen = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherUsername, setTeacherUsername] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      const request = requests.find(req => req._id === id);
      if (!request) return;

      const approvalResponse = await fetch(`${API_BASE_URL}/registrations/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: id,
          studentId: request.studentId,
          courseId: request.course._id
        }),
      });

      if (!approvalResponse.ok) throw new Error('Failed to approve request');
      setRequests(prev => prev.filter(req => req._id !== id));
    } catch (error) {
      console.error("Error in approval process:", error);
      setErrorMessage("Failed to approve request. Please try again.");
      setModalVisible(true);
    }
  };

  const handleRejection = async (id: string) => {
    try {
      const request = requests.find(req => req._id === id);
      if (!request) return;

      const rejectionResponse = await fetch(`${API_BASE_URL}/registrations/reject/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: request.studentId,
          courseId: request.course._id
        }),
      });

      if (!rejectionResponse.ok) throw new Error('Failed to reject request');
      setRequests(prev => prev.filter(req => req._id !== id));
    } catch (error) {
      console.error("Error in rejection process:", error);
      setErrorMessage("Failed to reject request. Please try again.");
      setModalVisible(true);
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
      <View style={styles.header}>
        <Text style={styles.headerText}>Course Requests</Text>
        <Text style={styles.subHeaderText}>{requests.length} pending</Text>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
                  <Text style={styles.rejectButtonText}>Reject</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  header: {
    backgroundColor: "#FFFFFF", 
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000', 
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subHeaderText: {
    fontSize: 15,
    color: '#666', // updated color for better legibility
    marginTop: 4,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  noRequestsText: { 
    fontSize: 18, 
    textAlign: "center", 
    marginTop: 20,
    color: '#aaa' 
  },
  requestCard: {
    backgroundColor: "#F9F9F9", // light background for cards
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  courseText: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#000", // updated text color for contrast
    letterSpacing: 1,
  },
  usernameText: { 
    fontSize: 15, 
    color: "#666", // updated text color
    marginTop: 4 
  },
  buttonContainer: { 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    marginTop: 20,
    gap: 12
  },
  approveButton: { 
    backgroundColor: "#00E676", 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
  },
  rejectButton: { 
    backgroundColor: "#FF1744", 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
  },
  buttonText: { 
    color: "#121212", 
    fontSize: 15, 
    fontWeight: "500", 
    textAlign: "center" 
  },
  rejectButtonText: {
    color: "#121212",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center"
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', // updated modal background to white
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '85%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#000', // updated text color for contrast
  },
  modalButton: {
    backgroundColor: "#00E676",
    padding: 16,
    borderRadius: 25,
    width: '100%',
  },
  modalButtonText: {
    color: '#121212',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default TeacherApprovalScreen;
