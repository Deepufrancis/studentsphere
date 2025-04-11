// PdfUploadScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const PdfUploadScreen = () => {
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/upload`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      setDocFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!docFile) {
      Alert.alert('No file selected', 'Please select a PDF or Word document to upload.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('pdf', {
      uri: docFile.uri,
      name: docFile.name,
      type: docFile.mimeType,
    });

    try {
      const res = await axios.post(`${API_BASE_URL}/upload/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', `File uploaded: ${res.data.file.filename}`);
      setDocFile(null);

      // Refresh document list after successful upload
      fetchDocuments();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const viewDocument = async (documentId) => {
    try {
      const documentUrl = `${API_BASE_URL}/upload/${documentId}`;
      const supported = await Linking.canOpenURL(documentUrl);
      
      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        Alert.alert('Error', "Can't open this document");
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const renderDocumentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.documentItem} 
      onPress={() => viewDocument(item._id)}
    >
      <Text style={styles.documentName}>{item.filename}</Text>
      <Text style={styles.documentDate}>
        {new Date(item.uploadedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Document Manager</Text>

      <View style={styles.uploadSection}>
        <Button title="Pick Document" onPress={pickDocument} />

        {docFile && <Text style={styles.filename}>Selected: {docFile.name}</Text>}

        {uploading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          docFile && <Button title="Upload Document" onPress={handleUpload} />
        )}
      </View>

      <View style={styles.divider} />

      <Text style={styles.subtitle}>Uploaded Documents</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No documents uploaded yet</Text>
          }
          style={styles.documentList}
        />
      )}

      <Button title="Refresh" onPress={fetchDocuments} />
    </View>
  );
};

export default PdfUploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  filename: {
    marginVertical: 10,
    textAlign: 'center',
  },
  uploadSection: {
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  documentList: {
    flex: 1,
    marginBottom: 10,
  },
  documentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 16,
    flex: 1,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: '#666',
  },
});
