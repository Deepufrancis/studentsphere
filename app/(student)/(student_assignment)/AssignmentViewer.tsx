import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../../constants';

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

      <Picker
        selectedValue={selectedCourse}
        onValueChange={(itemValue) => setSelectedCourse(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select a Course" value={null} />
        {courses.map((course) => (
          <Picker.Item key={course._id} label={course.courseName} value={course._id} />
        ))}
      </Picker>

      {selectedCourse && (
        <Text style={styles.selectedCourse}>
          Selected Course: {courses.find((c) => c._id === selectedCourse)?.courseName}  
          {"\n"}Course ID: {selectedCourse}
        </Text>
      )}

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.assignmentCard}
            onPress={() =>
              router.push({
                pathname: '/AssignmentDetails',
                params: {
                  id:item._id,
                  title: item.title,
                  description: item.description,
                  dueDate: item.dueDate,
                },
              })
            }
          >
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <Text style={styles.assignmentDescription}>{item.description}</Text>
            <Text style={styles.assignmentDueDate}>Due: {new Date(item.dueDate).toDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f8f8' },
  welcome: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  picker: { height: 50, backgroundColor: '#fff', marginBottom: 10 },
  selectedCourse: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  assignmentCard: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentTitle: { fontSize: 18, fontWeight: 'bold' },
  assignmentDescription: { fontSize: 14, color: '#777' },
  assignmentDueDate: { fontSize: 14, marginTop: 5, color: '#555' },
});

export default AssignmentViewer;
