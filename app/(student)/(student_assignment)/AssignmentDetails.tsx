import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants";
import * as DocumentPicker from "expo-document-picker";

interface Comment {
  _id: string;
  user: string;
  text: string;
  createdAt: string;
}

interface Assignment {
  title: string;
  description: string;
  dueDate: string;
  submissionDetails?: {
    submittedAt: string;
    fileName: string;
    fileUrl: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export default function AssignmentDetails() {
  const params = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [file, setFile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    getUserData();
    fetchAssignmentDetails();
    if (userId) {
      checkIfUploaded(userId);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (params.id) {
        fetchComments();
      }
    }, [params.id])
  );

  const getUserData = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      if (storedUsername) {
        setUsername(storedUsername);
        setStudentId(storedUsername);
        setUserId(storedUsername); // Add this line to set userId
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchAssignmentDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch assignment details");
      const data = await response.json();
      console.log("Assignment data received:", JSON.stringify(data, null, 2));
      setAssignment(data);
    } catch (error) {
      console.error("Error fetching assignment details:", error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assignments/${params.id}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !username) return;
    try {
      await fetch(`${API_BASE_URL}/assignments/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username, text: newComment }),
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const checkIfUploaded = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${params.id}/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.uploaded) {
          setAlreadyUploaded(true);
          setUploadedFileUrl(data.fileUrl);
          // Update assignment with submission details
          setAssignment(prev => prev ? {
            ...prev,
            submissionDetails: {
              submittedAt: data.submittedAt,
              fileName: data.fileName,
              fileUrl: data.fileUrl
            }
          } : null);
        }
      }
    } catch (error) {
      console.error("Error checking upload status:", error);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking file:", error);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const uploadFile = async () => {
    if (!file) {
      Alert.alert("Error", "No file selected");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      } as any);
      formData.append("userId", userId);

      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${params.id}`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.ok) {
        Alert.alert("Success", "Assignment uploaded successfully!");
        setFile(null);
        setAlreadyUploaded(true);
      } else {
        const errorText = await response.text();
        Alert.alert("Error", `Upload failed: ${errorText}`);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to upload assignment: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${params.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLongPress = (commentId: string, commentUser: string) => {
    if (commentUser === username) {
      Alert.alert(
        "Delete Comment",
        "Do you want to delete this comment?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", onPress: () => deleteComment(commentId), style: "destructive" }
        ]
      );
    }
  };

  const viewUploadedAssignment = () => {
    if (uploadedFileUrl) {
      // Open the PDF in device's default viewer
      Linking.openURL(uploadedFileUrl);
    }
  };

  return (
    <View style={styles.scrollContainer}>
      <ScrollView style={styles.mainContainer}>
        <View style={styles.container}>
          {assignment ? (
            <View style={styles.assignmentCard}>
              <Text style={styles.title}>{assignment.title}</Text>
              <Text style={styles.description}>{assignment.description}</Text>
              <Text style={styles.dueDate}>Due: {new Date(assignment.dueDate).toDateString()}</Text>
              {assignment.submissionDetails && (
                <View style={styles.submissionDetails}>
                  <Text style={styles.submittedText}>
                    Submitted on: {new Date(assignment.submissionDetails.submittedAt).toLocaleString()}
                  </Text>
                  <Text style={styles.submittedFile}>
                    File: {assignment.submissionDetails.fileName}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <ActivityIndicator size="large" color="#007bff" />
          )}

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Assignment Submission</Text>
            {alreadyUploaded ? (
              <View style={styles.uploadedContainer}>
                <Text style={styles.uploadedText}>Assignment submitted successfully</Text>
                <TouchableOpacity 
                  style={styles.viewButton} 
                  onPress={viewUploadedAssignment}
                >
                  <Text style={styles.viewButtonText}>View Submission</Text>
                </TouchableOpacity>
              </View>
            ) : file ? (
              <View style={styles.fileContainer}>
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={removeFile}>
                  <Text style={styles.cancelButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectButton} onPress={pickFile}>
                <Text style={styles.selectButtonText}>Select File</Text>
              </TouchableOpacity>
            )}

            {!alreadyUploaded && (
              <TouchableOpacity style={[styles.submitButton, !file && styles.disabledButton]} onPress={uploadFile} disabled={!file || uploading}>
                <Text style={styles.submitButtonText}>{uploading ? "Uploading..." : "Submit"}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.discussionHeader}>
            <Text style={styles.sectionTitle}>Discussion</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.commentsSection}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={[...comments].reverse()}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onLongPress={() => handleLongPress(item._id, item.user)}
                delayLongPress={500}
              >
                <View style={[
                  styles.comment,
                  item.user === username && styles.ownComment
                ]}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>
                      {item.user === username ? `you (${item.user})` : item.user}
                    </Text>
                    <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text>{item.text}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.commentsList}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.addButton} onPress={addComment}>
            <Text style={styles.addButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: { 
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  description: { fontSize: 16, color: "#495057", marginBottom: 10 },
  uploadButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 8, marginBottom: 10, alignItems: "center" },
  uploadButtonText: { color: "#fff", fontWeight: "bold" },
  uploadedFile: { fontSize: 16, color: "#28a745", marginBottom: 10, fontWeight: "bold" },
  inputContainer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  addButton: { backgroundColor: "#007bff", padding: 10, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  comment: { 
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // for Android shadow
    borderBottomWidth: 0, // remove the border since we have shadow
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  commentUser: { 
    fontWeight: "bold" 
  },
  commentTime: {
    color: '#6c757d',
    fontSize: 12,
  },
  dueDate: { fontSize: 16, color: "#6c757d", marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 0 },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  cancelButton: {
    padding: 5,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.65,
  },
  uploadedText: {
    color: '#28a745',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  mainContainer: {
    flex: 1,
  },
  commentsSection: {
    height: '45%',
    backgroundColor: '#f8f9fa', // lighter background to show shadow better
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  commentsList: {
    flex: 1,
    paddingVertical: 10,
  },
  ownComment: {
    backgroundColor: '#e8f5e9',
    shadowColor: '#1b5e20',
  },
  discussionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 10,
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadedContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submissionDetails: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  submittedText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submittedFile: {
    color: '#1b5e20',
    fontSize: 14,
    marginTop: 5,
  },
});