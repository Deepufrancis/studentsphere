import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { API_BASE_URL } from "../constants";

export default function ResourcesScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [files, setFiles] = useState([]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.type !== "cancel") setSelectedFile(result);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      });
      const res = await fetch(`${API_BASE_URL}/resources/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        Alert.alert("File uploaded!");
        setSelectedFile(null);
        fetchFiles();
      } else {
        Alert.alert("Upload failed");
      }
    } catch (error) {
      Alert.alert("An error occurred");
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/resources/files`);
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      Alert.alert("Could not fetch files");
    }
  };

  const downloadFile = async (fileId: string) => {
    // Replace with actual download logic or a WebView
    Alert.alert("Download started for file ID: " + fileId);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Choose File" onPress={pickFile} />
      <Button title="Upload" onPress={uploadFile} />
      <FlatList
        data={files}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: any) => (
          <TouchableOpacity onPress={() => downloadFile(item._id)}>
            <Text style={{ marginVertical: 5 }}>{item.filename}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
