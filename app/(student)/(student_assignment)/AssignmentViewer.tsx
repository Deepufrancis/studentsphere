import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';

interface Course {
  _id: string;
  courseName: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
}

const AssignmentViewer = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const fetchAssignments = async () => {
      if (!selectedCourse) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/assignments/course/${selectedCourse}`);
        setAssignments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };
    fetchAssignments();
  }, [selectedCourse]);

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {username}</Text>

      <View style={styles.courseSection}>
        <Text style={styles.sectionTitle}>Select Course</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCourse}
            onValueChange={(itemValue) => setSelectedCourse(itemValue)}
            style={styles.picker}
            dropdownIconColor="#4a5568"
          >
            <Picker.Item 
              label="Choose a course" 
              value={null} 
              style={styles.pickerPlaceholder}
            />
            {courses.map((course) => (
              <Picker.Item 
                key={course._id} 
                label={course.courseName} 
                value={course._id}
                style={styles.pickerItem}
              />
            ))}
          </Picker>
        </View>
      </View>

      {selectedCourse && (
        <Text style={styles.selectedCourse}>
          {courses.find((c) => c._id === selectedCourse)?.courseName}
        </Text>
      )}

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
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
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentDescription}>{item.description}</Text>
              <Text style={styles.assignmentDueDate}>Due: {new Date(item.dueDate).toDateString()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9ff',
  },
  welcome: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 25,
    color: '#1a202c',
  },
  courseSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  picker: {
    height: 48,
  },
  pickerPlaceholder: {
    color: '#a0aec0',
  },
  pickerItem: {
    fontSize: 16,
    color: '#2d3748',
  },
  selectedCourse: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
    color: '#2d3748',
    borderLeftWidth: 3,
    borderLeftColor: '#4a5568',
    paddingLeft: 10,
  },
  assignmentCardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  assignmentCard: {
    padding: 18,
    borderRadius: 16,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 10,
    lineHeight: 20,
  },
  assignmentDueDate: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
  },
});

export default AssignmentViewer;
