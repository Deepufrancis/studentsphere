import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from "../constants";

export default function Resources() {
  const [userId, setUserId] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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

  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Resources</Text>
        <Text style={styles.headerSubtitle}>Access study materials</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.resourcesSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : filteredResources.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery ? "search-outline" : "documents-outline"} 
                size={80} 
                color="#e0e0e0" 
              />
              <Text style={styles.emptyStateText}>
                {searchQuery ? "No matching resources" : "No resources yet"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? "Try a different search term" : "Resources you upload will appear here"}
              </Text>
            </View>
          ) : (
            filteredResources.map((resource) => (
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
  scrollView: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
  },
});