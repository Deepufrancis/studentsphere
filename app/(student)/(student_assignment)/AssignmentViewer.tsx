import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  _id: string;
  courseName: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  courseId: string;
}

const AssignmentViewer = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('loggedInUser');
        if (storedUsername) setUsername(storedUsername);
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!username) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/registrations/student/${username}`);
        setCourses(response.data.approvedCourses || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [username]);

  useEffect(() => {
    const fetchAllAssignments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/assignments`);
        const sortedAssignments = sortAssignments(response.data, sortOrder);
        setAllAssignments(sortedAssignments);
        setAssignments(sortedAssignments);
      } catch (error) {
        console.error("Error fetching all assignments:", error);
      }
    };
    fetchAllAssignments();
  }, [sortOrder]);

  const sortAssignments = (assignments: Assignment[], order: 'asc' | 'desc') => {
    return [...assignments].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const filterByCourse = (courseId: string | null) => {
    setSelectedCourse(courseId);
    if (!courseId) {
      setAssignments(allAssignments);
    } else {
      const filtered = allAssignments.filter(assignment => 
        assignment.courseId === courseId
      );
      setAssignments(filtered);
    }
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setAssignments(sortAssignments(assignments, newOrder));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterSection}>
          <View style={styles.sortButtons}>
            <TouchableOpacity 
              style={[
                styles.sortButton,
                sortOrder === 'asc' ? styles.sortButtonActive : {}
              ]}
              onPress={toggleSortOrder}
            >
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={sortOrder === 'asc' ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.sortButtonText,
                sortOrder === 'asc' && styles.sortButtonTextActive
              ]}>
                Earliest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sortButton,
                sortOrder === 'desc' ? styles.sortButtonActive : {}
              ]}
              onPress={toggleSortOrder}
            >
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={sortOrder === 'desc' ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.sortButtonText,
                sortOrder === 'desc' && styles.sortButtonTextActive
              ]}>
                Latest First
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.courseFilterScroll}
          contentContainerStyle={styles.filterContentContainer}
        >
          <TouchableOpacity
            style={[
              styles.courseFilterPill,
              !selectedCourse && styles.courseFilterPillActive
            ]}
            onPress={() => filterByCourse(null)}
          >
            <Text style={[
              styles.courseFilterText,
              !selectedCourse && styles.courseFilterTextActive
            ]}>All Tasks</Text>
          </TouchableOpacity>
          {courses.map((course) => (
            <TouchableOpacity
              key={course._id}
              style={[
                styles.courseFilterPill,
                selectedCourse === course._id && styles.courseFilterPillActive
              ]}
              onPress={() => filterByCourse(course._id)}
            >
              <Text style={[
                styles.courseFilterText,
                selectedCourse === course._id && styles.courseFilterTextActive
              ]}>{course.courseName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const dueDate = new Date(item.dueDate);
          const isOverdue = dueDate < new Date();
          const isDueSoon = !isOverdue && dueDate.getTime() - new Date().getTime() < 86400000 * 2; // 2 days

          return (
            <TouchableOpacity
              style={styles.assignmentCardWrapper}
              onPress={() =>
                router.push({
                  pathname: '/AssignmentDetails',
                  params: {
                    id: item._id,
                    title: item.title,
                    description: item.description,
                    dueDate: item.dueDate,
                  },
                })
              }
            >
              <LinearGradient
                colors={['#ffffff', '#f7f9fc']}
                style={styles.assignmentCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.assignmentTitle}>{item.title}</Text>
                  <View style={[
                    styles.statusIndicator,
                    isOverdue ? styles.statusOverdue : 
                    isDueSoon ? styles.statusUrgent : 
                    styles.statusOnTrack
                  ]} />
                </View>
                <Text style={styles.assignmentDescription}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.dueDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color="#4a5568" />
                    <Text style={[
                      styles.assignmentDueDate,
                      isOverdue && styles.overdueText
                    ]}>
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4a5568" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    textAlign: "center" 
  },
  filterBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterContentContainer: {
    paddingHorizontal: 12,
  },
  filterSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  courseFilterScroll: {
    padding: 12,
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
  listContainer: {
    padding: 20,
  },
  assignmentCardWrapper: {
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusOverdue: {
    backgroundColor: '#e53e3e',
  },
  statusUrgent: {
    backgroundColor: '#ecc94b',
  },
  statusOnTrack: {
    backgroundColor: '#48bb78',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e53e3e',
    backgroundColor: 'rgba(229, 62, 62, 0.05)',
  },
  assignmentDueDate: {
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: '600',
    marginLeft: 4,
  },
  overdueText: {
    color: '#e53e3e',
  },
});

export default AssignmentViewer;
