import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LiveClassLinksScreen = () => {
  interface LiveClass {
    _id: string;
    courseId: {
      _id: string;
      courseName: string;
      description: string;
    };
    liveClassLink: string;
    scheduledTime: string;
  }

  interface Course {
    _id: string;
    courseName: string;
    description: string;
  }

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [user, setUser] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('upcoming'); // 'upcoming' or 'later'
  const [filterCourse, setFilterCourse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLiveClasses = async (studentUsername: string) => {
    try {
      // Fix the endpoint to match the backend route structure
      const response = await axios.get(`${API_BASE_URL}/registration/student/${studentUsername}`);
      
      if (!response.data || !response.data.approvedCourses) {
        console.log("API response format:", response.data);
        setError("No approved courses found or invalid response format");
        setLoading(false);
        return;
      }
      
      const approvedCourses = response.data.approvedCourses || [];
      setCourses(approvedCourses);
      
      if (approvedCourses.length === 0) {
        setLiveClasses([]);
        setLoading(false);
        return;
      }
      
      // Fetch live classes for approved courses
      try {
        const liveClassPromises = approvedCourses.map(course =>
          axios.get(`${API_BASE_URL}/liveclass/course/${course._id}`)
        );
        
        const liveClassResponses = await Promise.all(liveClassPromises);
        const allLiveClasses = liveClassResponses.flatMap(response => response.data);
        setLiveClasses(allLiveClasses);
      } catch (liveClassError) {
        console.error('Error fetching live class data:', liveClassError);
        setError("Failed to fetch live class information.");
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError("Failed to fetch your registered courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('loggedInUser');
        console.log('Fetched user data:', userData);
        if (userData) {
          // Store the string directly without parsing
          setUser(userData);
          fetchLiveClasses(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError("Failed to retrieve user information.");
      }
    };
    fetchUser();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const refresh = async () => {
      try {
        const userData = await AsyncStorage.getItem("loggedInUser");
        if (userData) {
          await fetchLiveClasses(userData);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
        setError("Failed to refresh data.");
      } finally {
        setRefreshing(false);
      }
    };
    refresh();
  }, []);

  const getSortedAndFilteredClasses = () => {
    let filtered = [...liveClasses];
    
    // Apply course filter
    if (filterCourse !== 'all') {
      filtered = filtered.filter(cls => cls.courseId._id === filterCourse);
    }
    
    // Apply date sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledTime).getTime();
      const dateB = new Date(b.scheduledTime).getTime();
      const now = new Date().getTime();
      
      if (sortOrder === 'upcoming') {
        // Show upcoming classes first (future dates)
        // If both are in future, show closest first
        // If both are in past, show most recent first
        if (dateA > now && dateB > now) {
          return dateA - dateB; // Closest future first
        } else if (dateA < now && dateB < now) {
          return dateB - dateA; // Most recent past first
        } else {
          return dateA > dateB ? 1 : -1; // Future before past
        }
      } else {
        // Later dates first
        return dateB - dateA;
      }
    });
    
    return filtered;
  };

  const filterButtons: { id: string; label: string; icon: "time-outline" | "calendar-outline" }[] = [
    { id: 'upcoming', label: 'Upcoming First', icon: 'time-outline' },
    { id: 'later', label: 'Later First', icon: 'calendar-outline' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Class Links</Text>
      <View style={styles.filterBar}>
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="funnel-outline" size={18} color="#007AFF" />
            <Text style={styles.filterToggleText}>Filter</Text>
            <Ionicons 
              name={showFilters ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          
          <View style={styles.sortButtons}>
            {filterButtons.map(button => (
              <TouchableOpacity
                key={button.id}
                style={[
                  styles.sortButton,
                  sortOrder === button.id && styles.sortButtonActive
                ]}
                onPress={() => setSortOrder(button.id)}
              >
                <Ionicons 
                  name={button.icon} 
                  size={16} 
                  color={sortOrder === button.id ? '#fff' : '#007AFF'} 
                />
                <Text style={[
                  styles.sortButtonText,
                  sortOrder === button.id && styles.sortButtonTextActive
                ]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {showFilters && (
          <View style={styles.filterDropdown}>
            <Text style={styles.filterLabel}>Course:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.courseFilterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.courseFilterPill,
                  filterCourse === 'all' && styles.courseFilterPillActive
                ]}
                onPress={() => setFilterCourse('all')}
              >
                <Text style={[
                  styles.courseFilterText,
                  filterCourse === 'all' && styles.courseFilterTextActive
                ]}>All Courses</Text>
              </TouchableOpacity>
              {courses.map(course => (
                <TouchableOpacity
                  key={course._id}
                  style={[
                    styles.courseFilterPill,
                    filterCourse === course._id && styles.courseFilterPillActive
                  ]}
                  onPress={() => setFilterCourse(course._id)}
                >
                  <Text style={[
                    styles.courseFilterText,
                    filterCourse === course._id && styles.courseFilterTextActive
                  ]}>{course.courseName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={getSortedAndFilteredClasses()}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerContent}>
                  <Text style={styles.courseName}>{item.courseId.courseName}</Text>
                  <Text style={styles.courseDescription}>{item.courseId.description}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.dateTimeLabel}>Date:</Text>
                    <Text style={styles.dateTimeValue}>
                      {new Date(item.scheduledTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.dateTimeLabel}>Time:</Text>
                    <Text style={styles.dateTimeValue}>
                      {new Date(item.scheduledTime).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                {item.liveClassLink && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(item.liveClassLink)}
                  >
                    <Ionicons name="videocam" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.linkText}>Join Live Class</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  courseCard: { 
    backgroundColor: "#fff", 
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerContent: {
    flex: 1,
    marginRight: 10,
  },
  cardContent: {
    padding: 16,
  },
  courseName: { 
    fontSize: 18, 
    fontWeight: "600",
    color: '#2c3e50',
    marginBottom: 4,
  },
  courseDescription: { 
    fontSize: 14, 
    color: "#666",
    marginBottom: 8,
  },
  dateTimeContainer: {
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '600',
    marginRight: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  linkButton: { 
    backgroundColor: "#007AFF", 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // Make it pill-shaped
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    marginTop: 15,
    marginHorizontal: 10,
  },
  linkText: { 
    color: "#fff", 
    fontWeight: "700", // Made slightly bolder
    fontSize: 15,
    letterSpacing: 0.5, // Added letter spacing for better readability
  },
  buttonIcon: {
    marginRight: 8,
  },
  filterBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterSection: {
    padding: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggleText: {
    color: '#007AFF',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  filterDropdown: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  courseFilterScroll: {
    flexGrow: 0,
  },
  courseFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
    marginRight: 8,
  },
  courseFilterPillActive: {
    backgroundColor: '#007AFF',
  },
  courseFilterText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  courseFilterTextActive: {
    color: '#fff',
  },
  error: { color: "red", textAlign: "center", marginTop: 20 },
});

export default LiveClassLinksScreen;