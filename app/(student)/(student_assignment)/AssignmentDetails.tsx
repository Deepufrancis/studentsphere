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
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from '@expo/vector-icons';

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
    grade?: number;
    feedback?: string;
    status?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [isDiscussionModalVisible, setIsDiscussionModalVisible] = useState(false);

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
        
        // If we already have assignment ID, check upload status immediately
        if (params.id) {
          checkIfUploaded(storedUsername);
        }
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

  // Make sure this method uses the correct API routes
  const checkIfUploaded = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${params.id}/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Upload status check:", data);
        
        if (data.uploaded) {
          setAlreadyUploaded(true);
          setUploadedFileUrl(data.fileUrl);
          
          // Update assignment with submission details including grade and feedback if available
          setAssignment(prev => prev ? {
            ...prev,
            submissionDetails: {
              submittedAt: data.submittedAt,
              fileName: data.fileName,
              fileUrl: data.fileUrl,
              grade: data.grade,
              feedback: data.feedback,
              status: data.status
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

  // Ensure upload function uses the correct endpointh
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
        type: file.mimeType || 'application/pdf',
        name: file.name || 'assignment.pdf'
      } as any);
      
      formData.append('userId', userId);
  
      // Updated to match the route in the server.js file
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
      
      // Refresh data to ensure everything is up to date
      refreshAll();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert("Error", `Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // Ensure replace function uses the correct endpoint
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

      // Updated to match the route in the server.js file
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

      // Update local state with the new uploaded file information
      setUploadedFileUrl(result.submission.fileUrl);
      setAlreadyUploaded(true);
      
      // Update assignment with submission details - prevent view from disappearing
      setAssignment(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          submissionDetails: {
            submittedAt: result.submission.lastUpdated || result.submission.submittedAt,
            fileName: result.submission.fileName,
            fileUrl: result.submission.fileUrl
          }
        };
      });
      
      setFile(null);
      Alert.alert("Success", "Assignment replaced successfully!");
      
      // Refresh data to ensure everything is up to date
      refreshAll();
      
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
    // Use either the saved URL in state or from the assignment object
    const fileUrl = uploadedFileUrl || (assignment?.submissionDetails?.fileUrl);
    
    if (fileUrl) {
      console.log("Opening file URL:", fileUrl);
      Linking.openURL(fileUrl).catch(err => {
        console.error("Error opening URL:", err);
        Alert.alert("Error", "Could not open the file. Please try again later.");
      });
    } else {
      Alert.alert("Error", "No file URL available");
    }
  };

  // Add this useEffect to make sure we maintain the uploaded state
  useEffect(() => {
    if (assignment?.submissionDetails && !alreadyUploaded) {
      setAlreadyUploaded(true);
      setUploadedFileUrl(assignment.submissionDetails.fileUrl);
    }
  }, [assignment]);

  // Add a refresh function to update all data
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchAssignmentDetails(),
        fetchComments(),
        userId ? checkIfUploaded(userId) : Promise.resolve()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Add this function to toggle modal visibility
  const toggleDiscussionModal = () => {
    setIsDiscussionModalVisible(!isDiscussionModalVisible);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        style={styles.mainContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            colors={["#1976d2"]}
            tintColor={"#1976d2"}
          />
        }
      >
        {assignment ? (
          <View style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.title}>{assignment.title}</Text>
              <View style={styles.dueDateContainer}>
                <Ionicons name="calendar-outline" size={18} color="#e74c3c" />
                <Text style={styles.dueDate}>
                  Due: {new Date(assignment.dueDate).toLocaleDateString(undefined, { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <Text style={styles.description}>{assignment.description}</Text>
            
            {/* Display submission status */}
            <View style={styles.submissionStatusContainer}>
              <Text style={styles.submissionStatusTitle}>
                Submission Status
              </Text>
              
              {assignment.submissionDetails ? (
                <View style={styles.submissionComplete}>
                  <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                  <Text style={styles.submissionCompleteText}>Submitted</Text>
                </View>
              ) : (
                <View style={styles.submissionPending}>
                  <Ionicons name="time-outline" size={24} color="#f39c12" />
                  <Text style={styles.submissionPendingText}>Not submitted yet</Text>
                </View>
              )}
            </View>
            
            {/* Display submission details if assignment is already submitted */}
            {assignment.submissionDetails && (
              <View style={styles.submissionDetails}>
                <View style={styles.submissionInfoRow}>
                  <Ionicons name="time-outline" size={18} color="#7f8c8d" />
                  <Text style={styles.submittedText}>
                    Submitted: {new Date(assignment.submissionDetails.submittedAt).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.submissionInfoRow}>
                  <Ionicons name="document-outline" size={18} color="#7f8c8d" />
                  <Text style={styles.submittedFile} numberOfLines={1} ellipsizeMode="middle">
                    {assignment.submissionDetails.fileName}
                  </Text>
                </View>
                
                {/* Display submission status */}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    assignment.submissionDetails.status === "graded" ? styles.gradedBadge : styles.pendingBadge
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {assignment.submissionDetails.status === "graded" ? "Graded" : "Pending"}
                    </Text>
                  </View>
                </View>
                
                {/* Display grade if available */}
                {assignment.submissionDetails.grade !== undefined && (
                  <View style={styles.gradeContainer}>
                    <View style={styles.gradeHeader}>
                      <Ionicons name="ribbon-outline" size={22} color="#3498db" />
                      <Text style={styles.gradeTitle}>Grade</Text>
                    </View>
                    <View style={styles.gradeBox}>
                      <Text style={styles.gradeValue}>{assignment.submissionDetails.grade}</Text>
                      <Text style={styles.gradeMax}>/100</Text>
                    </View>
                  </View>
                )}
                
                {/* Display feedback if available */}
                {assignment.submissionDetails.feedback && (
                  <View style={styles.feedbackContainer}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="chatbox-ellipses-outline" size={22} color="#3498db" />
                      <Text style={styles.feedbackTitle}>Teacher Feedback</Text>
                    </View>
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackText}>
                        {assignment.submissionDetails.feedback}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* View uploaded file button */}
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={viewUploadedAssignment}
                >
                  <Ionicons name="eye-outline" size={18} color="#fff" />
                  <Text style={styles.viewButtonText}>View Submission</Text>
                </TouchableOpacity>

                {/* File replacement section */}
                <View style={styles.replaceContainer}>
                  <Text style={styles.replaceText}>Replace your submission</Text>
                  {file ? (
                    <View style={styles.fileContainer}>
                      <View style={styles.fileIconContainer}>
                        <Ionicons name="document-text-outline" size={24} color="#3498db" />
                      </View>
                      <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                        {file.name}
                      </Text>
                      <TouchableOpacity style={styles.cancelButton} onPress={removeFile}>
                        <Ionicons name="close-circle" size={22} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.selectReplaceButton}
                      onPress={pickFile}
                    >
                      <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                      <Text style={styles.selectReplaceButtonText}>Select New File</Text>
                    </TouchableOpacity>
                  )}
                  
                  {file && (
                    <TouchableOpacity 
                      style={styles.replaceFileButton}
                      onPress={replaceFile}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <View style={styles.uploadingContainer}>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={styles.replaceFileButtonText}>Uploading...</Text>
                        </View>
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={20} color="#fff" />
                          <Text style={styles.replaceFileButtonText}>Replace Submission</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        )}

        {/* Show upload section only if not already uploaded */}
        {!alreadyUploaded && (
          <View style={styles.uploadSection}>
            <View style={styles.uploadSectionHeader}>
              <Ionicons name="cloud-upload-outline" size={24} color="#3498db" />
              <Text style={styles.sectionTitle}>Submit Assignment</Text>
            </View>
            
            <Text style={styles.supportedFormats}>
              Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR
            </Text>
            
            {file ? (
              <View style={styles.fileContainer}>
                <View style={styles.fileIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#3498db" />
                </View>
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                  {file.name}
                </Text>
                <TouchableOpacity style={styles.cancelButton} onPress={removeFile}>
                  <Ionicons name="close-circle" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectButton} onPress={pickFile}>
                <Ionicons name="attach-outline" size={20} color="#fff" />
                <Text style={styles.selectButtonText}>Select File</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.submitButton, !file && styles.disabledButton]} 
              onPress={uploadFile} 
              disabled={!file || uploading}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Uploading...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Assignment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Floating Discussion Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={toggleDiscussionModal}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
        {comments.length > 0 && (
          <View style={styles.commentBadge}>
            <Text style={styles.commentBadgeText}>
              {comments.length > 99 ? '99+' : comments.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Discussion Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDiscussionModalVisible}
        onRequestClose={toggleDiscussionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.discussionHeaderContent}>
                <Ionicons name="chatbubbles-outline" size={24} color="#3498db" />
                <Text style={styles.modalTitle}>Discussion</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={toggleDiscussionModal}
              >
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            {/* Discussion content */}
            <View style={styles.discussionContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#3498db" style={styles.commentsLoading} />
              ) : comments.length === 0 ? (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbox-outline" size={50} color="#bdc3c7" />
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.startDiscussionText}>Be the first to start the discussion</Text>
                </View>
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
                          <View style={styles.commentUserInfo}>
                            <View style={styles.commentUserAvatar}>
                              <Text style={styles.commentUserInitial}>
                                {item.user.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.commentUser}>
                              {item.user === username ? `You` : item.user}
                            </Text>
                          </View>
                          <Text style={styles.commentTime}>{formatDate(item.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.commentsListContent}
                />
              )}
            </View>

            {/* Comment input section in modal */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
              style={styles.modalInputWrapper}
            >
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline={true}
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[styles.modalAddButton, !newComment.trim() && styles.disabledAddButton]} 
                  onPress={() => {
                    addComment();
                    if (newComment.trim()) {
                      // Optional: close keyboard after submitting
                      // Keyboard.dismiss();
                    }
                  }}
                  disabled={!newComment.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  mainContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
    lineHeight: 28,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dueDate: {
    fontSize: 14,
    color: "#e74c3c",
    fontWeight: '600',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 12,
  },
  description: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
    marginBottom: 20,
  },
  submissionStatusContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  submissionStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  submissionComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
  submissionCompleteText: {
    color: '#2ecc71',
    fontWeight: '600',
    marginLeft: 8,
  },
  submissionPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 8,
  },
  submissionPendingText: {
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 8,
  },
  submissionDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  submissionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  submittedText: {
    color: "#7f8c8d",
    fontSize: 14,
    marginLeft: 8,
  },
  submittedFile: {
    color: "#7f8c8d",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  replaceContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    borderColor: '#e1e4e8',
    borderWidth: 1,
  },
  replaceText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
    color: '#2c3e50',
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginLeft: 8,
  },
  supportedFormats: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderColor: '#e1e4e8',
    borderWidth: 1,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    borderColor: '#e1e4e8',
    borderWidth: 1,
    marginBottom: 16,
  },
  fileIconContainer: {
    marginRight: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
  },
  cancelButton: {
    padding: 4,
  },
  selectButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
    opacity: 0.8,
  },
  selectReplaceButton: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectReplaceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  replaceFileButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceFileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsLoading: {
    padding: 40,
  },
  noCommentsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
    marginTop: 12,
  },
  startDiscussionText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  commentsList: {
    marginTop: 8,
  },
  commentsListContent: {
    paddingBottom: 20,
  },
  comment: { 
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownComment: {
    backgroundColor: '#ebf5fb',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  commentUserInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  commentUser: {
    fontWeight: "600",
    fontSize: 15,
    color: '#2c3e50',
  },
  commentTime: {
    color: '#95a5a6',
    fontSize: 13,
  },
  commentText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
  },
  inputContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: "#e0e0e0", 
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
  },
  addButton: {
    backgroundColor: "#3498db",
    padding: 12, 
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAddButton: {
    backgroundColor: '#95a5a6',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db', // Using the current blue theme
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  commentBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  commentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: windowHeight * 0.8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: '#fff',
  },
  discussionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 8,
  },
  closeButton: {
    padding: 5,
  },
  discussionContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
    fontSize: 15,
    maxHeight: 100,
  },
  modalAddButton: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  gradedBadge: {
    backgroundColor: '#d5f5e3',
  },
  pendingBadge: {
    backgroundColor: '#fef9e7',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gradeContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  gradeBox: {
    backgroundColor: '#ebf5fb',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  gradeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2980b9',
  },
  gradeMax: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 4,
  },
  feedbackContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  feedbackBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  feedbackText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});