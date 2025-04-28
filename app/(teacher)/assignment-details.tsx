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
        <View style={styles.chatModalContent}>
          {/* Chat Header with modern styling */}
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.chatBackButton} 
              onPress={closeDiscussion}
              activeOpacity={0.7}
            >
              <Text style={styles.chatBackIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.chatTitleContainer}>
              <Text style={styles.chatTitle}>Class Discussion</Text>
              <View style={styles.chatStatusContainer}>
                <View style={styles.statusIndicator} />
                <Text style={styles.chatStatusText}>
                  {loading ? 'Connecting...' : `${comments.length} messages`}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Chat Messages Area */}
          <View style={styles.chatMessagesContainer}>
            {loading ? (
              <View style={styles.chatLoaderContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.chatLoaderText}>Loading conversation...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.chatEmptyContainer}>
                <View style={styles.chatEmptyIconContainer}>
                  <Text style={styles.chatEmptyIcon}>💬</Text>
                </View>
                <Text style={styles.chatEmptyTitle}>No messages yet</Text>
                <Text style={styles.chatEmptySubtitle}>Start the class discussion now!</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={[...comments].reverse()}
                keyExtractor={(item) => item._id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                renderItem={({ item, index }) => {
                  // Check if this is a sequence of messages from same user
                  const prevItem = index > 0 ? [...comments].reverse()[index - 1] : null;
                  const nextItem = index < comments.length - 1 ? [...comments].reverse()[index + 1] : null;
                  const isFirstInSequence = !prevItem || prevItem.user !== item.user;
                  const isLastInSequence = !nextItem || nextItem.user !== item.user;
                  const isSameUser = username === item.user;
                  
                  return (
                    <View style={[
                      styles.chatMessageWrapper,
                      isSameUser ? styles.ownMessageWrapper : styles.otherMessageWrapper
                    ]}>
                      {/* Show avatar only for first message in a sequence from others */}
                      {!isSameUser && isFirstInSequence && (
                        <View style={styles.chatAvatar}>
                          <Text style={styles.chatAvatarText}>
                            {item.user.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      
                      {/* Show username only for first message in sequence from others */}
                      {!isSameUser && isFirstInSequence && (
                        <Text style={styles.chatUsername}>{item.user}</Text>
                      )}
                      
                      <TouchableOpacity
                        onLongPress={() => {
                          if (username === item.user) {
                            deleteComment(item._id);
                          }
                        }}
                        activeOpacity={0.8}
                        style={[
                          styles.chatMessage,
                          isSameUser ? styles.ownMessage : styles.otherMessage,
                          isFirstInSequence ? 
                            (isSameUser ? styles.ownFirstMessage : styles.otherFirstMessage) : 
                            {},
                          isLastInSequence ? 
                            (isSameUser ? styles.ownLastMessage : styles.otherLastMessage) : 
                            {}
                        ]}
                      >
                        <Text style={styles.chatMessageText}>{item.text}</Text>
                        <Text style={styles.chatTime}>
                          {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Spacer to replace avatar for own messages */}
                      {isSameUser && <View style={styles.avatarSpacer} />}
                    </View>
                  );
                }}
                contentContainerStyle={styles.chatMessagesList}
                style={styles.chatMessagesFlat}
                showsVerticalScrollIndicator={false}
                initialNumToRender={15}
                inverted={false}
              />
            )}

            {/* Modern Chat Input Area */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
              style={styles.chatInputWrapper}
            >
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Type a message..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={MAX_COMMENT_LENGTH}
                  numberOfLines={3}
                  placeholderTextColor="#94a3b8"
                />
                <View style={styles.chatInputActions}>
                  <Text style={styles.chatCharCount}>
                    {newComment.length}/{MAX_COMMENT_LENGTH}
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.chatSendButton, 
                      (!newComment.trim() || isPosting) && styles.chatSendButtonDisabled
                    ]} 
                    onPress={addComment}
                    disabled={!newComment.trim() || isPosting}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.chatSendButtonText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
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
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Add pulsing effect with border
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  floatingButtonIcon: {
    fontSize: 28,
    color: '#fff',
  },
  commentBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  commentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContent: {
    height: windowHeight * 0.8,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.2,
  },
  closeModalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Better discussion container
  discussionContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  
  // Enhanced comments list
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentsListContent: {
    paddingBottom: 16,
  },
  loadingCommentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingCommentsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  commentsLoading: {
    marginVertical: 8,
  },
  noCommentsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#f1f5f9',
  },
  noCommentsIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#cbd5e1',
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  startDiscussionText: {
    fontSize: 15,
    color: '#cbd5e1',
  },
  
  // Better styled comments
  comment: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: '88%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ownComment: {
    backgroundColor: "#e0f2fe",
    marginLeft: 'auto',
    borderBottomRightRadius: 4,
  },
  otherComment: {
    backgroundColor: "#fff",
    marginRight: 'auto',
    borderBottomLeftRadius: 4,
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
    color: "#1e40af",
  },
  timestamp: { 
    fontSize: 12, 
    color: "#94a3b8",
    fontStyle: 'italic'
  },
  commentText: { 
    fontSize: 15, 
    marginTop: 4,
    lineHeight: 22,
    color: "#334155"
  },
  
  // Enhanced input wrapper
  modalInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 14,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    padding: 14,
    maxHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  modalAddButton: {
    marginLeft: 12,
    backgroundColor: '#3b82f6',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    marginRight: 6,
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  // Modern Modal Styles
  modernModalContent: {
    width: '100%',
    height: windowHeight * 0.85,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerTextContainer: {
    flex: 1,
  },
  discussionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  modernDiscussionContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modernCommentsListContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  modernComment: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '95%',
  },
  modernOwnComment: {
    marginLeft: 'auto',
    marginRight: 10,
  },
  modernOtherComment: {
    marginLeft: 10,
    marginRight: 'auto',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ownAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 18,
  },
  otherAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: '#f97316',
    width: 36,
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 18,
  },
  commentContentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  modernCommentUser: {
    fontWeight: '700',
    fontSize: 15,
    color: '#0f172a',
  },
  modernTimestamp: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modernCommentText: {
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
    color: '#1e293b',
  },
  commentDate: {
    fontSize: 11,
    color: '#94a3b8',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  modernInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
  },
  modernInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  modernAddButton: {
    marginLeft: 10,
    backgroundColor: '#3b82f6',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modernAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modernCharCount: {
    alignSelf: 'flex-end',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginRight: 4,
  },
  // Modern Chat UI Styles
  chatModalContent: {
    width: '100%',
    height: windowHeight * 0.9,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatBackIcon: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '600',
  },
  chatTitleContainer: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  chatStatusText: {
    fontSize: 13,
    color: '#64748b',
  },
  chatMessagesContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatMessagesFlat: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatMessagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  chatLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatLoaderText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  chatEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  chatEmptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  chatEmptyIcon: {
    fontSize: 32,
  },
  chatEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  chatEmptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  chatMessageWrapper: {
    marginBottom: 2,
    flexDirection: 'column',
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  chatAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  avatarSpacer: {
    width: 28,
    height: 4,
  },
  chatUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
    marginBottom: 4,
  },
  chatMessage: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 1,
    maxWidth: '100%',
  },
  ownMessage: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end', 
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  ownFirstMessage: {
    borderTopRightRadius: 16,
  },
  ownLastMessage: {
    borderBottomRightRadius: 16,
    marginBottom: 12,
  },
  otherFirstMessage: {
    borderTopLeftRadius: 16,
  },
  otherLastMessage: {
    borderBottomLeftRadius: 16,
    marginBottom: 12,
  },
  chatMessageText: {
    fontSize: 15,
    lineHeight: 20,
    paddingRight: 32, // Space for the time
  },
  chatMessageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  chatMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  chatMessageText: {
    color: '#fff',
  },
  chatMessageText: {
    color: '#0f172a',
  },
  chatTime: {
    fontSize: 10,
    position: 'absolute',
    bottom: 6,
    right: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatTime: {
    color: '#94a3b8',
  },
  chatInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chatInputContainer: {
    backgroundColor: '#fff',
  },
  chatTextInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingRight: 80, // Space for buttons
    paddingTop: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 46,
  },
  chatInputActions: {
    position: 'absolute',
    right: 8,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatCharCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 8,
  },
  chatSendButton: {
    backgroundColor: '#3b82f6',
    width: 60,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  chatSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  chatSendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

