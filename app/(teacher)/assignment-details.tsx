import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

interface Comment {
  _id: string;
  user: string;
  text: string;
  createdAt: string;
}

export default function AssignmentDetails() {
  const params = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
    getUsername();
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

  const addComment = async () => {
    if (!newComment.trim()) return;
    if (!username) {
      console.error("Username not found!");
      return;
    }

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{params.title}</Text>
      <Text style={styles.course}>Course: {params.course}</Text>
      <Text style={styles.description}>{params.description}</Text>
      <Text style={styles.dueDate}>
        Due Date: {params.dueDate ? new Date(params.dueDate as string).toDateString() : "N/A"}
      </Text>

      <Text style={styles.sectionTitle}>Discussion</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
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
                <Text style={styles.commentUser}>{item.user}</Text>
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
        />
        <TouchableOpacity style={styles.addButton} onPress={addComment}>
          <Text style={styles.addButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  course: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  description: { fontSize: 14, marginBottom: 10 },
  dueDate: { fontSize: 14, color: "gray", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  comment: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ownComment: {
    backgroundColor: "#d1ecf1",
    borderColor: "#bee5eb",
  },
  otherComment: {
    backgroundColor: "#fff",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentUser: { fontWeight: "bold" },
  timestamp: { fontSize: 12, color: "gray" },
  commentText: { fontSize: 14, marginTop: 2 },
  inputContainer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  addButton: {
    marginLeft: 10,
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
});

