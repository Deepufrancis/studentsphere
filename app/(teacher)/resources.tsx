import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, Button, FlatList, TouchableOpacity, 
  Alert, StyleSheet, ActivityIndicator, ScrollView, 
  KeyboardAvoidingView, Platform, Linking, Modal,
  SafeAreaView
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import { API_BASE_URL } from "../constants";

interface Resource {
  _id: string;
  title: string;
  description: string;
  fileUrl?: string;
  filePath?: string;
  fileType?: string;
  loggedInUser: string;
  createdAt: string;
}

const ResourceScreen = () => {
  const { loggedInUser } = useSession(); // Add this line
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(null);

  const RESOURCE_API_URL = `${API_BASE_URL}/resources`;

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(RESOURCE_API_URL);
      setResources(response.data);
    } catch (error) {
      console.error("Error fetching resources", error);
      Alert.alert("Error", "Could not fetch resources");
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Accept all file types
        copyToCacheDirectory: true
      });
      
      if (result.type !== "cancel") {
        console.log("Document picked:", result);
        setFile(result);
      }
    } catch (error) {
      console.error("Document picking error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadResource = async () => {
    if (!title) return Alert.alert("Error", "Title is required");
    if (!editMode && !file && !fileUrl) return Alert.alert("Error", "Select a file or enter a URL");

    setUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("loggedInUser", loggedInUser); // Changed from username
    
    if (file) {
      // Handle different document picker result formats
      const fileToUpload = {
        uri: file.uri,
        type: file.mimeType || file.type || 'application/octet-stream',
        name: file.name || file.fileName || 'upload.file',
      };
      
      console.log("Uploading file:", fileToUpload);
      formData.append("file", fileToUpload as any);
    } 
    
    if (fileUrl) {
      formData.append("fileUrl", fileUrl);
    }

    try {
      let response;
      
      if (editMode && currentResourceId) {
        console.log("Updating resource:", currentResourceId);
        response = await axios.put(`${RESOURCE_API_URL}/${currentResourceId}`, formData, {
          headers: { 
            "Content-Type": "multipart/form-data",
            "Accept": "application/json",
          },
          timeout: 30000, // 30 second timeout
        });
      } else {
        console.log("Uploading to:", RESOURCE_API_URL);
        response = await axios.post(RESOURCE_API_URL, formData, {
          headers: { 
            "Content-Type": "multipart/form-data",
            "Accept": "application/json",
          },
          timeout: 30000, // 30 second timeout
        });
      }
      
      console.log("Upload response:", response.data);
      
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setFile(null);
      setFileUrl("");
      setEditMode(false);
      setCurrentResourceId(null);
      fetchResources();
      Alert.alert("Success", editMode ? "Resource updated successfully!" : "Resource uploaded successfully!");
      setUploading(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      console.error("Error details:", error.response?.data || error.message);
      Alert.alert(
        editMode ? "Update Failed" : "Upload Failed", 
        `${error.response?.data?.error || error.message || "Failed to save resource"}`
      );
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setFileUrl("");
    setModalVisible(false);
    setEditMode(false);
    setCurrentResourceId(null);
  };

  const deleteResource = async (id: string) => {
    try {
      await axios.delete(`${RESOURCE_API_URL}/${id}`);
      fetchResources();
      Alert.alert("Success", "Resource deleted");
    } catch (error) {
      console.error("Delete error", error);
      Alert.alert("Error", "Failed to delete resource");
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    
    if (fileType.includes('pdf')) return '📑';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    
    return '📄';
  };

  const openResource = async (resource: Resource) => {
    if (resource.fileUrl) {
      const canOpen = await Linking.canOpenURL(resource.fileUrl);
      if (canOpen) {
        await Linking.openURL(resource.fileUrl);
      } else {
        Alert.alert("Error", "Cannot open URL: " + resource.fileUrl);
      }
    } else if (resource.filePath) {
      // For files on server, construct full URL
      const fileUrl = `${API_BASE_URL}/${resource.filePath}`;
      try {
        const canOpen = await Linking.canOpenURL(fileUrl);
        if (canOpen) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert("Error", "Cannot open file");
        }
      } catch (error) {
        console.error("Error opening file:", error);
        Alert.alert("Error", "Failed to open the file");
      }
    }
  };

  const editResource = (resource: Resource) => {
    setTitle(resource.title);
    setDescription(resource.description || "");
    setFileUrl(resource.fileUrl || "");
    setFile(null);
    setEditMode(true);
    setCurrentResourceId(resource._id);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Learning Resources</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditMode(false);
            setCurrentResourceId(null);
            setTitle("");
            setDescription("");
            setFile(null);
            setFileUrl("");
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add Resource</Text>
        </TouchableOpacity>
      </View>

      {/* Resources List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={styles.loader} />
      ) : resources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.noResourcesText}>No resources available</Text>
          <TouchableOpacity 
            style={styles.emptyAddButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyAddButtonText}>Add Your First Resource</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.resourceItem}>
              <TouchableOpacity 
                style={styles.contentContainer} 
                onPress={() => openResource(item)}
              >
                <View style={styles.resourceHeader}>
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                
                {item.description ? (
                  <Text style={styles.resourceDescription}>{item.description}</Text>
                ) : null}
                
                <View style={styles.resourceFooter}>
                  {item.fileUrl ? (
                    <View style={styles.resourceUrlContainer}>
                      <Text style={styles.resourceUrlText}>🔗 {item.fileUrl}</Text>
                    </View>
                  ) : (
                    <View style={styles.resourceFileContainer}>
                      <Text style={styles.resourceFileText}>
                        {getFileIcon(item.fileType)} {item.fileType?.split('/')[1] || 'File'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.resourceUsername}>By: {item.loggedInUser}</Text> {/* Changed from username */}
                </View>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => editResource(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteResource(item._id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.resourcesList}
        />
      )}

      {/* Add/Edit Resource Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>{editMode ? "Edit Resource" : "Add New Resource"}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={cancelUpload}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.label}>Title *</Text>
              <TextInput 
                value={title} 
                onChangeText={setTitle} 
                style={styles.textInput}
                placeholder="Enter resource title" 
              />

              <Text style={styles.label}>Description</Text>
              <TextInput 
                value={description} 
                onChangeText={setDescription} 
                style={[styles.textInput, styles.textArea]} 
                multiline={true}
                numberOfLines={3}
                placeholder="Enter resource description" 
              />

              <Text style={styles.label}>File URL (optional)</Text>
              <TextInput 
                value={fileUrl} 
                onChangeText={setFileUrl} 
                style={styles.textInput}
                placeholder="https://example.com/resource" 
              />

              <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
                <Text style={styles.fileButtonText}>Select a File</Text>
              </TouchableOpacity>
              
              {file && (
                <View style={styles.selectedFileContainer}>
                  <Text style={styles.selectedFileText}>
                    Selected: {file.name}
                  </Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={cancelUpload}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.uploadButton, uploading && styles.uploadingButton]} 
                  onPress={uploadResource}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.uploadButtonText}>
                      {editMode ? "Update" : "Upload"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyAddButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999999',
  },
  modalScrollView: {
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '600',
  },
  
  // Existing styles (slightly modified)
  scrollView: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fileButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  fileButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedFileContainer: {
    backgroundColor: '#e8f4ff',
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  selectedFileText: {
    color: '#0066cc',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
  },
  uploadingButton: {
    backgroundColor: '#004c99',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResourcesText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  resourcesList: {
    padding: 16,
    paddingBottom: 40,
  },
  resourceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  resourceDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceUrlContainer: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resourceUrlText: {
    fontSize: 13,
    color: '#0066cc',
  },
  resourceFileContainer: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resourceFileText: {
    fontSize: 13,
    color: '#0066cc',
  },
  resourceUsername: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    width: 60,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  editButtonText: {
    color: '#0066cc',
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ffeeee',
    justifyContent: 'center',
    width: 60,
    flex: 1,
  },
  deleteButtonText: {
    color: '#cc0000',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ResourceScreen;
