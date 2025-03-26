import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Course {
  _id: string;
  courseName: string;
  description: string;
  teacher: string;
}

interface Student {
  _id: string;
  username: string;
}

interface AttendanceRecord {
  _id: string;
  studentId: string;
  username: string;
  status: 'Present' | 'Absent';
  date: string;
}

const AttendancePage = () => {
  const [username, setUsername] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchCourses = async (teacherUsername: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses?teacher=${teacherUsername}`
      );
      setCourses(response.data);
    } catch (err) {
      setError("Failed to fetch courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsername = async () => {
      const storedUser = await AsyncStorage.getItem("loggedInUser");
      if (storedUser) {
        setUsername(storedUser);
        fetchCourses(storedUser);
      }
    };

    fetchUsername();
  }, []);

  const fetchStudents = async (courseId: string) => {
    if (!courseId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reg_students/${courseId}/students`);
      if (!res.ok) throw new Error("Failed to fetch students");

      const data = await res.json();
      setStudents(data);
    } catch (error) {
      Alert.alert("Error", "Could not fetch students.");
      setError("Failed to fetch students");
    }
  };

  useEffect(() => {
    if (selectedCourse) {
      fetchStudents(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchAttendanceRecords = async (courseId: string, date: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/records`, {
        params: {
          course: courseId,
          date: date
        }
      });
      
      const records = response.data.map((record: any) => ({
        _id: record._id,
        studentId: record.student,
        username: record.username,
        status: record.status,
        date: record.date
      }));
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance records');
    }
  };

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchAttendanceRecords(selectedCourse, selectedDate);
    }
  }, [selectedCourse, selectedDate]);

  const markAttendance = async (student: Student, status: 'Present' | 'Absent') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/mark`, {
        courseId: selectedCourse,
        username: student.username,  // Changed from studentId to username
        status,
        date: selectedDate
      });

      if (response.data.success) {
        await fetchAttendanceRecords(selectedCourse, selectedDate);
      } else {
        throw new Error(response.data.error || 'Failed to mark attendance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
      Alert.alert('Error', err.message || 'Failed to mark attendance');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Attendance</Text>
      </View>

      {loading && <Text>Loading courses...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCourse}
          onValueChange={setSelectedCourse}
          style={styles.picker}
        >
          <Picker.Item label="Select a course" value="" />
          {courses.map((course) => (
            <Picker.Item
              key={course._id}
              label={course.courseName}
              value={course._id}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          Date: {new Date(selectedDate).toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      {selectedCourse && (
        <View style={styles.studentSection}>
          <Text style={styles.sectionTitle}>Students List</Text>
          {students.length > 0 ? (
            <ScrollView style={styles.studentList}>
              {students.map((student) => (
                <View key={student._id} style={styles.studentCard}>
                  <Text style={styles.studentName}>{student.username}</Text>
                  <View style={styles.attendanceButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.button, 
                        styles.presentButton,
                        attendanceRecords.find(r => r.username === student.username)?.status === 'Present' && styles.activeButton
                      ]}
                      onPress={() => markAttendance(student, 'Present')}  // Pass entire student object
                    >
                      <Text style={styles.buttonText}>Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.button, 
                        styles.absentButton,
                        attendanceRecords.find(r => r.username === student.username)?.status === 'Absent' && styles.activeButton
                      ]}
                      onPress={() => markAttendance(student, 'Absent')}  // Pass entire student object
                    >
                      <Text style={styles.buttonText}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noStudentsText}>No students registered yet.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#f8f8f8" 
  },
  headerContainer: {
    marginBottom: 20,
    paddingVertical: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  error: { 
    color: "red", 
    marginBottom: 10 
  },
  studentList: {
    flex: 1,
    marginTop: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  presentButton: {
    backgroundColor: '#4CAF50',
  },
  absentButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  studentSection: {
    flex: 1,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  activeButton: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#000',
  },
  noStudentsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  }
});

export default AttendancePage;
