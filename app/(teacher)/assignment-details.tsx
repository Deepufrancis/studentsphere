import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Modal,
  Dimensions,
} from "react-native";
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";
import * as mime from 'mime';

interface Comment {
  _id: string;
  user: string;
  text: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  userId: string;
  fileName: string;
  submittedAt: string;
  status: string;
  grade?: number;
  feedback?: string;
  fileUrl: string;
}

export default function AssignmentDetails() {
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const MAX_COMMENT_LENGTH = 500;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isGrading, setIsGrading] = useState(false);
  const [isDiscussionModalVisible, setIsDiscussionModalVisible] = useState(false);

  useEffect(() => {
    fetchComments();
    getUsername();
    fetchSubmissions();
  }, []);

  const getUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("loggedInUser");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${params.id}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Fix the API endpoint to match the backend route
      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${params.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Submissions fetched:", data);
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      Alert.alert("Error", "Failed to load student submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || isPosting) return;
    if (!username) {
      console.error("Username not found!");
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: username, text: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/assignments/${params.id}/comments/${commentId}`, {
              method: "DELETE",
            });

            if (response.ok) {
              setComments((prev) => prev.filter((comment) => comment._id !== commentId));
            }
          } catch (error) {
            console.error("Error deleting comment:", error);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [comments]);

  const getMimeType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt': return 'application/vnd.ms-powerpoint';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt': return 'text/plain';
      case 'zip': return 'application/zip';
      case 'rar': return 'application/x-rar-compressed';
      default: return 'application/octet-stream';
    }
  };

  const downloadAndOpenFile = async (fileUrl: string, fileName: string) => {
    try {
      // Ensure we have a complete URL
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${API_BASE_URL}/${fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl}`;
      
      console.log("Download URL:", fullUrl);
      
      // Create a unique local file path with original extension
      const localPath = `${FileSystem.cacheDirectory}${fileName}`;

      // Show loading indicator
      Alert.alert("Downloading...", "Please wait while the file downloads.");
      
      // Download the file using the correct URL
      const downloadResult = await FileSystem.downloadAsync(fullUrl, localPath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      Alert.alert(
        "Download Complete",
        "Would you like to open the file now?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Open",
            onPress: async () => {
              try {
                if (Platform.OS === 'android') {
                  const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
                  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    type: mime.getType(fileName) || 'application/octet-stream',
                    flags: 1,
                  });
                } else {
                  const isSharingAvailable = await Sharing.isAvailableAsync();
                  if (isSharingAvailable) {
                    await Sharing.shareAsync(downloadResult.uri, {
                      mimeType: mime.getType(fileName) || 'application/octet-stream'
                    });
                  } else {
                    throw new Error('Sharing not available');
                  }
                }
              } catch (error) {
                console.error('Error opening file:', error);
                Alert.alert(
                  "Error",
                  "Failed to open file. The file format might not be supported by your device."
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert(
        "Download Error",
        "Failed to download file. Please check your connection and try again."
      );
    }
  };

  const handleViewFile = async (fileUrl: string, fileName: string) => {
    await downloadAndOpenFile(fileUrl, fileName);
  };

  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
    setGradeModalVisible(true);
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;
    
    setIsGrading(true);
    try {
      const numericGrade = parseFloat(grade);
      if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
        Alert.alert("Invalid Grade", "Please enter a valid grade between 0-100");
        setIsGrading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/uploads/${selectedSubmission._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "graded",
          grade: numericGrade, 
          feedback
        }),
      });

      if (response.ok) {
        // Update local submission data
        fetchSubmissions();
        setGradeModalVisible(false);
        Alert.alert("Success", "Submission graded successfully");
      } else {
        Alert.alert("Error", "Failed to grade submission");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      Alert.alert("Error", "An error occurred while grading");
    } finally {
      setIsGrading(false);
    }
  };

  const renderGradeModal = () => (
    <Modal
      visible={gradeModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setGradeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.gradeModalContainer}>
          <Text style={styles.gradeModalTitle}>Grade Submission</Text>
          <Text style={styles.submissionInfo}>
            Student: {selectedSubmission?.userId}
          </Text>
          <Text style={styles.submissionInfo}>
            File: {selectedSubmission?.fileName}
          </Text>
          
          <Text style={styles.inputLabel}>Grade (0-100):</Text>
          <TextInput
            style={styles.gradeInput}
            value={grade}
            onChangeText={setGrade}
            keyboardType="numeric"
            placeholder="Enter grade (0-100)"
          />
          
          <Text style={styles.inputLabel}>Feedback:</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            placeholder="Provide feedback on the submission"
          />
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setGradeModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, isGrading && styles.disabledButton]}
              onPress={submitGrade}
              disabled={isGrading}
            >
              {isGrading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSubmissionItem = ({ item }: { item: Submission }) => {
    if (!item) return null;
    
    const submissionDate = item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Unknown date';
    
    return (
      <View style={styles.submissionItem}>
        <View style={styles.submissionHeader}>
          <Text style={styles.submissionUser}>Student: {item.userId}</Text>
          <Text style={styles.submissionDate}>{submissionDate}</Text>
        </View>
        
        <View style={styles.fileInfoContainer}>
          <Text style={styles.fileInfoLabel}>File: </Text>
          <TouchableOpacity 
            onPress={() => handleViewFile(item.fileUrl, item.fileName)}
            activeOpacity={0.6}
          >
            <Text style={styles.fileNameLink} numberOfLines={1} ellipsizeMode="middle">
              📎 {item.fileName || "Unnamed file"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            item.status === "graded" ? styles.gradedStatusBadge : styles.pendingStatusBadge
          ]}>
            <Text style={styles.statusBadgeText}>{item.status || "pending"}</Text>
          </View>
          
          {item.status === "graded" && item.grade !== undefined && (
            <View style={styles.gradeContainer}>
              <Text style={styles.gradeText}>{item.grade}/100</Text>
            </View>
          )}
        </View>
        
        {item.feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Feedback:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.gradeButton}
          onPress={() => openGradeModal(item)}
        >
          <Text style={styles.gradeButtonText}>
            {item.status === "graded" ? "Update Grade" : "Grade"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSubmissions = () => (
    <View style={styles.submissionsSection}>
      <Text style={styles.sectionTitle}>Submissions ({submissions.length})</Text>
      
      {loadingSubmissions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.noSubmissionsContainer}>
          <Text style={styles.noSubmissions}>No submissions yet</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderSubmissionItem}
          contentContainerStyle={styles.submissionsList}
          showsVerticalScrollIndicator={true}
          initialNumToRender={10}
          onRefresh={fetchSubmissions}
          refreshing={loadingSubmissions}
        />
      )}
    </View>
  );

  const openDiscussion = () => {
    setIsDiscussionModalVisible(true);
  };

  const closeDiscussion = () => {
    setIsDiscussionModalVisible(false);
  };

  const renderDiscussion = () => (
    <Modal
      visible={isDiscussionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeDiscussion}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.discussionHeader}>
            <Text style={styles.modalTitle}>Discussion</Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={closeDiscussion}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.discussionContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={styles.commentsLoading} />
            ) : comments.length === 0 ? (
              <View style={styles.noCommentsContainer}>
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.startDiscussionText}>Be the first to start the discussion</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={[...comments].reverse()}
                keyExtractor={(item) => item._id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onLongPress={() => {
                      if (username === item.user) {
                        deleteComment(item._id);
                      }
                    }}
                    style={[
                      styles.comment,
                      username === item.user ? styles.ownComment : styles.otherComment,
                    ]}
                  >
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>
                        {item.user}{username === item.user ? " (you)" : ""}
                      </Text>
                      <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </TouchableOpacity>
                )}
                style={styles.commentsList}
              />
            )}

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
                  multiline
                  maxLength={MAX_COMMENT_LENGTH}
                  numberOfLines={3}
                />
                <TouchableOpacity 
                  style={[styles.modalAddButton, (!newComment.trim() || isPosting) && styles.disabledButton]} 
                  onPress={addComment}
                  disabled={!newComment.trim() || isPosting}
                >
                  {isPosting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.addButtonText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.charCount}>
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </Text>
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.title}>{params.title}</Text>
      <View style={styles.courseContainer}>
        <Text style={styles.courseLabel}>Course:</Text>
        <Text style={styles.courseText}>{params.course}</Text>
      </View>
      <Text style={styles.description}>{params.description}</Text>
      <View style={styles.dueDateContainer}>
        <Text style={styles.dueDateLabel}>Due:</Text>
        <Text style={styles.dueDateText}>
          {params.dueDate ? new Date(params.dueDate as string).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : "N/A"}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.mainContent}>
        {renderHeader()}
        {renderSubmissions()}
      </View>
      
      {/* Floating Discussion Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={openDiscussion}
      >
        <Text style={styles.floatingButtonIcon}>💬</Text>
        {comments.length > 0 && (
          <View style={styles.commentBadge}>
            <Text style={styles.commentBadgeText}>
              {comments.length > 99 ? '99+' : comments.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {renderDiscussion()}
      {renderGradeModal()}
    </KeyboardAvoidingView>
  );
}

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  courseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginRight: 8,
  },
  courseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
    marginBottom: 16,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  dueDateLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
    marginRight: 8,
  },
  dueDateText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  discussionContainer: {
    flex: 1,
    padding: 16,
  },
  discussionButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  discussionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submissionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    minHeight: 200,
  },
  submissionsList: {
    paddingBottom: 8,
  },
  submissionItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  noSubmissionsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noSubmissions: {
    color: '#94a3b8',
    fontSize: 16,
    fontStyle: 'italic',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  submissionUser: {
    fontWeight: '700',
    fontSize: 16,
    color: '#2c3e50',
  },
  submissionDate: {
    fontSize: 14,
    color: '#64748b',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  fileInfoLabel: {
    fontSize: 15,
    color: '#4b5563',
  },
  fileNameLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontSize: 15,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pendingStatusBadge: {
    backgroundColor: '#fef3c7',
  },
  gradedStatusBadge: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b', 
    textTransform: 'capitalize',
  },
  gradeContainer: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  feedbackContainer: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  gradeButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  gradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  gradeModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  gradeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  submissionInfo: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginVertical: 8,
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
 
 
 
  
  comment: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  ownComment: {
    backgroundColor: "#e3f2fd",
    borderColor: "#bbdefb",
    marginLeft: 20,
    marginRight: 4,
  },
  otherComment: {
    backgroundColor: "#fff",
    borderColor: "#e1e8ed",
    marginLeft: 4,
    marginRight: 20,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: 'center',
  },
  commentUser: { 
    fontWeight: "700",
    fontSize: 15,
    color: "#2c3e50",
  },
  timestamp: { 
    fontSize: 12, 
    color: "#94a3b8",
    fontStyle: 'italic'
  },
  commentText: { 
    fontSize: 15, 
    marginTop: 4,
    lineHeight: 20,
    color: "#4a5568"
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    marginTop: 12,
    marginBottom: 4,
  },
  input: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: "#e2e8f0", 
    borderRadius: 12, 
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    fontSize: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'flex-end',
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 15,
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginRight: 4,
  },
 
  fileName: {
    fontSize: 14,
    color: '#4a5568',
    marginVertical: 4,
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
 
  submissionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
 
  
 
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonIcon: {
    fontSize: 24,
    color: '#fff',
  },
  commentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
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
  modalContent: {
    height: windowHeight * 0.7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  closeModalButton: {
    padding: 8,
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  noCommentsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  startDiscussionText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  modalInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    maxHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  modalAddButton: {
    marginLeft: 12,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  commentsLoading: {
    marginVertical: 40,
  },
});

