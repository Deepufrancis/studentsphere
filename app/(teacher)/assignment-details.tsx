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
      const response = await fetch(`${API_BASE_URL}/uploads/assignment/${params.id}`);
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
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
      const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const fullUrl = `${API_BASE_URL}/${cleanFileUrl}`;
      const mimeType = getMimeType(fileName);
      
      // Create a unique local file path with original extension
      const localPath = `${FileSystem.cacheDirectory}${fileName}`;

      // Show download progress
      console.log(fullUrl);
      console.log(localPath);
      // Alert.alert("Downloading...", "Please wait while the file downloads.");

      const response = await fetch(`${API_BASE_URL}/${localPath}`, {
              method: "GET",
            });
      console.log(response);
      const downloadResult = await FileSystem.downloadAsync(fullUrl, localPath);
      
      if (!downloadResult.uri) {
        throw new Error('Download failed');
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
                    type: mimeType,
                    flags: 1,
                  });
                } else {
                  const isSharingAvailable = await Sharing.isAvailableAsync();
                  if (isSharingAvailable) {
                    await Sharing.shareAsync(downloadResult.uri, {
                      mimeType,
                      UTI: mimeType
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
        "Error",
        "Failed to download file. Please try again later."
      );
    }
  };

  const handleViewFile = async (fileUrl: string, fileName: string) => {
    console.log(fileUrl,"&" ,fileName);
    await downloadAndOpenFile(fileUrl, fileName);
  };

  const renderSubmissions = () => (
    <View style={styles.submissionsSection}>
      <Text style={styles.sectionTitle}>Submissions</Text>
      {loadingSubmissions ? (
        <ActivityIndicator size="large" />
      ) : submissions.length === 0 ? (
        <Text style={styles.noSubmissions}>No submissions yet</Text>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item._id}
          horizontal={false}
          renderItem={({ item }) => (
            <View style={styles.submissionItem}>
              <View style={styles.submissionHeader}>
                <Text style={styles.submissionUser}>Student: {item.userId}</Text>
                <Text style={styles.submissionDate}>
                  {new Date(item.submittedAt).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.fileName}>File: </Text>
              <TouchableOpacity 
                style={styles.fileNameContainer}
                onPress={() => handleViewFile(item.fileUrl, item.fileName)}
                activeOpacity={0.6}
              >
                <Text style={styles.fileNameLink}>
                  📎 {item.fileName}
                </Text>
              </TouchableOpacity>
              <View style={styles.submissionStatus}>
                <Text style={styles.statusText}>Status: {item.status}</Text>
                {item.grade && (
                  <Text style={styles.gradeText}>Grade: {item.grade}</Text>
                )}
              </View>
              {item.feedback && (
                <Text style={styles.feedbackText}>Feedback: {item.feedback}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );

  const openDiscussion = () => {
    setIsModalVisible(true);
  };

  const closeDiscussion = () => {
    setIsModalVisible(false);
  };

  const renderDiscussion = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      onRequestClose={closeDiscussion}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={closeDiscussion}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.discussionContainer}>
          <Text style={styles.sectionTitle}>Discussion</Text>
          {loading ? (
            <ActivityIndicator size="large" />
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
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={MAX_COMMENT_LENGTH}
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={[styles.addButton, (!newComment.trim() || isPosting) && styles.disabledButton]} 
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
        <TouchableOpacity 
          style={styles.discussionButton} 
          onPress={openDiscussion}
        >
          <Text style={styles.discussionButtonText}>View Discussion</Text>
        </TouchableOpacity>
      </View>
      {renderDiscussion()}
    </KeyboardAvoidingView>
  );
}

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
  },
  submissionItem: {
    backgroundColor: '#fff',
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
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  submissionUser: {
    fontWeight: '600',
    fontSize: 15,
    color: '#2c3e50',
  },
  submissionDate: {
    fontSize: 12,
    color: '#94a3b8',
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
  fileNameLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontSize: 14,
    marginLeft: 4,
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
  gradeText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noSubmissions: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
});

