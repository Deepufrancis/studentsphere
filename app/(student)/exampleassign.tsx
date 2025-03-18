import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants";

export default function UploadAssignment() {
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyUploaded, setAlreadyUploaded] = useState(false);
  const assignmentId = "67c7ff80551dc2363b04e058";

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUser = await AsyncStorage.getItem("loggedInUser");
      if (storedUser) {
        setUserId(storedUser);
        checkIfUploaded(storedUser);
      }
    };
    fetchUserId();
  }, []);

  const checkIfUploaded = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${assignmentId}/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.uploaded) {
          setAlreadyUploaded(true);
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

      const response = await fetch(`${API_BASE_URL}/uploads/assignments/${assignmentId}`, {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Assignment</Text>
      {alreadyUploaded ? (
        <Text style={styles.uploadedText}>Assignment already uploaded</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  uploadedText: { fontSize: 18, color: "red", fontWeight: "bold" },
  fileContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#e9ecef", padding: 10, borderRadius: 8 },
  fileName: { fontSize: 16, color: "#495057", flex: 1 },
  cancelButton: { backgroundColor: "#dc3545", padding: 6, borderRadius: 8, marginLeft: 10 },
  cancelButtonText: { color: "#fff", fontWeight: "bold" },
  selectButton: { backgroundColor: "#007bff", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  selectButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  submitButton: { backgroundColor: "#28a745", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10, width: "100%" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disabledButton: { backgroundColor: "#6c757d" },
});