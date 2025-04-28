import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Linking,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from "../constants";

export default function Resources() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getUserData();
    fetchResources();
  }, []);

  const getUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("loggedInUser");
      if (storedUserId) {
        setUserId(storedUserId);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources`);
      const data = await response.json();
      if (response.ok) {
        setResources(data);
      } else {
        Alert.alert("Error", "Failed to fetch resources");
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      Alert.alert("Error", "Failed to fetch resources");
    } finally {
      setLoading(false);
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

  const uploadResource = async () => {
    if (!file || !userId || !title || !description) {
      Alert.alert("Error", "Please fill all fields and select a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name || 'resource.pdf'
      } as any);
      
      formData.append('userId', userId);
      formData.append('title', title);
      formData.append('description', description);

      const response = await fetch(`${API_BASE_URL}/resources`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
      });

      const result = await response.json();

      if (response.status === 400) {
        // Handle validation errors
        const errorMessage = result.details ? 
          result.details.join('\n') : 
          result.error || 'Please check all fields';
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      Alert.alert("Success", "Resource uploaded successfully!");
      setFile(null);
      setTitle("");
      setDescription("");
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      Alert.alert("Error", `Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const renderUploadModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload New Resource</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#95a5a6"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.supportedFormats}>
              Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP, RAR
            </Text>

            {file ? (
              <View style={styles.fileContainer}>
                <Ionicons name="document-text-outline" size={24} color="#3498db" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Ionicons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectButton} onPress={pickFile}>
                <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Select File</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.uploadButton, (!file || !title || !description) && styles.disabledButton]}
              onPress={async () => {
                await uploadResource();
                if (!uploading) {
                  setModalVisible(false);
                  fetchResources();
                }
              }}
              disabled={!file || !title || !description || uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Upload Resource</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Resources</Text>
        <Text style={styles.headerSubtitle}>Access study materials</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.resourcesSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : resources.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="documents-outline" size={80} color="#e0e0e0" />
              <Text style={styles.emptyStateText}>No resources yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Resources you upload will appear here
              </Text>
            </View>
          ) : (
            resources.map((resource) => (
              <View key={resource._id} style={styles.resourceItem}>
                <View style={styles.resourceIconContainer}>
                  <Ionicons name="document-text" size={28} color="#3498db" />
                  <Text style={styles.resourceType}>
                    {resource.fileName?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </Text>
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceDescription} numberOfLines={2}>
                    {resource.description}
                  </Text>
                  <View style={styles.resourceMeta}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={14} color="#95a5a6" />
                      <Text style={styles.resourceDate}>
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => Linking.openURL(resource.fileUrl)}
                    >
                      <Ionicons name="eye-outline" size={18} color="#3498db" />
                      <Text style={styles.viewText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {renderUploadModal()}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    backgroundColor: '#3498db',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  resourceIconContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  resourceType: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 4,
    fontWeight: '600',
  },
  resourceInfo: {
    flex: 1,
    padding: 16,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  viewText: {
    color: '#3498db',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#3498db',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  supportedFormats: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileName: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  selectButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  resourcesSection: {
    padding: 16,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  resourceDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
});