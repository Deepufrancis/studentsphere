import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../constants';
import DateTimePicker from '@react-native-community/datetimepicker';

const AttendanceMarker = () => {
  const { courseId, courseName } = useLocalSearchParams();
  const [students, setStudents] = useState<{ _id: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch students for the course
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reg_students/${courseId}/students`);
      if (!res.ok) throw new Error('Failed to fetch students');

      const data = await res.json();
      setStudents(data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllAttendance = async (status: 'present' | 'absent') => {
    const formattedDate = date.toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/markAll/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: formattedDate, 
          status 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === 'Attendance already marked for this date') {
          Alert.alert('Error', 'Attendance has already been marked for this date');
        } else {
          throw new Error('Failed to mark attendance');
        }
        return;
      }

      setAttendance(
        students.reduce((acc, student) => ({
          ...acc,
          [student._id]: status === 'present'
        }), {})
      );
      Alert.alert('Success', `All students marked as ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance for all students.');
    }
  };

  const clearAllAttendance = () => {
    setAttendance({});
  };

  const submitAttendance = async () => {
    const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const attendanceData = students.map((student) => ({
      studentId: student._id,
      present: attendance[student._id] || false,
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/mark/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: formattedDate, 
          attendance: attendanceData 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === 'Attendance already marked for this date') {
          Alert.alert('Error', 'Attendance has already been marked for this date');
        } else {
          throw new Error('Failed to mark attendance');
        }
        return;
      }

      Alert.alert('Success', 'Attendance marked successfully');
      setIsStudentModalOpen(false);
      clearAllAttendance();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mark Attendance - {courseName}</Text>

      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.buttonText}>Select Date: {date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setIsStudentModalOpen(true)}>
          <Text style={styles.buttonText}>Mark Attendance</Text>
        </TouchableOpacity>
      )}

      <Modal visible={isStudentModalOpen} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Mark Attendance</Text>
          <Text style={styles.dateText}>Date: {date.toLocaleDateString()}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.presentButton]}
              onPress={() => markAllAttendance('present')}
            >
              <Text style={styles.buttonText}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.absentButton]}
              onPress={() => markAllAttendance('absent')}
            >
              <Text style={styles.buttonText}>All Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearAllAttendance}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.studentItem,
                  attendance[item._id] ? styles.presentItem : styles.absentItem
                ]}
                onPress={() => toggleAttendance(item._id)}
              >
                <Text style={styles.studentName}>{item.username}</Text>
                <View style={styles.statusContainer}>
                  <Text style={attendance[item._id] ? styles.presentText : styles.absentText}>
                    {attendance[item._id] ? '✔ Present' : '✘ Absent'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
          
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={submitAttendance}
            >
              <Text style={styles.buttonText}>Submit Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={() => setIsStudentModalOpen(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  studentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 18,
    color: '#2c3e50',
  },
  present: {
    backgroundColor: '#27ae60',
    borderRadius: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  presentButton: {
    backgroundColor: '#27ae60',
  },
  absentButton: {
    backgroundColor: '#e74c3c',
  },
  clearButton: {
    backgroundColor: '#7f8c8d',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
    flex: 2,
  },
  presentItem: {
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  absentItem: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  statusContainer: {
    borderRadius: 4,
    padding: 4,
  },
  presentText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  absentText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 15,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
});

export default AttendanceMarker;
