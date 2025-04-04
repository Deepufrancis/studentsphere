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
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'application/zip',
          'application/x-rar-compressed'
        ]
      });
      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to select file");
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const uploadFile = async () => {
    if (!file || !userId) {
      Alert.alert("Error", !file ? "No file selected" : "User ID not found");
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      formData.append('file', {
        uri: file.uri,
        type: 'application/pdf',
        name: file.name || 'assignment.pdf'
      } as any);
      
      formData.append('userId', userId);
  
      const response = await fetch(`${API_BASE_URL}/uploads/${params.id}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
          // Remove Content-Type header to let the browser set it with boundary
        },
      });
  
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server response: ${responseText}`);
      }
  
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
  
      setUploadedFileUrl(result.submission.fileUrl);
      setAlreadyUploaded(true);
      fetchAssignmentDetails();
      Alert.alert("Success", "Assignment uploaded successfully!");
      setFile(null);
      
    } catch (error) {
      Alert.alert("Error", `Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const replaceFile = async () => {
    if (!file || !userId) {
      Alert.alert("Error", !file ? "No file selected" : "User ID not found");
      return;
    }
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      // Ensure file object is properly formatted
      const fileToUpload = {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name || 'assignment.pdf'
      };
      
      formData.append('file', fileToUpload as any);
      formData.append('userId', userId);

      console.log('Replacing file:', {
        assignmentId: params.id,
        userId,
        fileName: file.name
      });

      const response = await fetch(`${API_BASE_URL}/uploads/${params.id}/replace`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Important: Do not set Content-Type header for FormData
        },
      });

      // Log response for debugging
      const responseText = await response.text();
      console.log('Server response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid server response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Replacement failed');
      }

      setUploadedFileUrl(result.submission.fileUrl);
      fetchAssignmentDetails();
      checkIfUploaded(userId);
      Alert.alert("Success", "Assignment replaced successfully!");
      setFile(null);
      
    } catch (error) {
      console.error('File replacement error:', error);
      Alert.alert("Error", `Replacement failed: ${error.message}`);
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

          {!alreadyUploaded && (
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Assignment Submission</Text>
              <Text style={styles.supportedFormats}>
                Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR
              </Text>
              {file ? (
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
              <TouchableOpacity 
                style={[styles.submitButton, !file && styles.disabledButton]} 
                onPress={uploadFile} 
                disabled={!file || uploading}
              >
                <Text style={styles.submitButtonText}>
                  {uploading ? "Uploading..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
    backgroundColor: "#f0f2f5",
  },
  container: { 
    padding: 16,
  },
  title: { 
    fontSize: 26, 
    fontWeight: "800",
    marginBottom: 12,
    color: "#1a1a1a"
  },
  description: { 
    fontSize: 16, 
    color: "#4a4a4a", 
    marginBottom: 12,
    lineHeight: 24
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  comment: { 
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ownComment: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: { 
    fontWeight: "700",
    fontSize: 15,
    color: '#1a1a1a'
  },
  commentTime: {
    color: '#757575',
    fontSize: 13,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: "#e0e0e0", 
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#ffffff',
    fontSize: 15
  },
  addButton: { 
    backgroundColor: "#1976d2", 
    padding: 12, 
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center'
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 15
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  viewButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  submissionDetails: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
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
  replaceContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    width: '100%',
  },
  replaceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  replaceButton: {
    backgroundColor: '#fd7e14',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  replaceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  replaceFileButton: {
    backgroundColor: '#fd7e14',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  replaceFileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  supportedFormats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});