import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Student {
  _id: string;
  username: string;
}

interface AttendanceRecord {
  courseId: string;
  courseName: string;
  date: string;
  students: Array<{
    username: string;
    present: boolean;
  }>;
}

const AttendanceMarker = () => {
  const { courseId, courseName } = useLocalSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reg_students/${courseId}/students`);
      const data = await res.json();
      setStudents(data);
      const initialAttendance: { [key: string]: boolean } = {};
      data.forEach((student: Student) => {
        initialAttendance[student._id] = false;
      });
      setAttendance(initialAttendance);
    } catch (err) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const markAll = (status: boolean) => {
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      students.forEach((student) => {
        newAttendance[student._id] = status;
      });
      return newAttendance;
    });
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      newAttendance[studentId] = !prev[studentId];
      return newAttendance;
    });
  };

  const submitAttendance = async () => {
    const formattedDate = date.toISOString().split('T')[0];
    // Format records using username instead of _id
    const validRecords = students
      .filter(student => attendance[student._id] !== undefined)
      .map(student => ({
        username: student.username, // Use username instead of _id
        status: attendance[student._id],
      }));

    if (validRecords.length === 0) {
      Alert.alert('Error', 'No attendance records to submit');
      return;
    }

    const payload = {
      course: courseId,
      date: formattedDate,
      records: validRecords,
    };

    console.log('Submitting payload:', payload); // For debugging

    try {
      const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to mark attendance');
      }

      Alert.alert('Success', result.message);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Submission failed');
    }
  };

  const fetchAttendanceByDate = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `${API_BASE_URL}/attendance/date/${formattedDate}?courseId=${courseId}`
      );
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      if (isViewMode) {
        fetchAttendanceByDate(selectedDate);
      }
    }
  };

  const handleIndividualMarking = (studentId: string, status: boolean) => {
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      newAttendance[studentId] = status;
      return newAttendance;
    });
    setShowEditModal(false);
    setSelectedStudent(null);
  };

  const renderViewMode = () => (
    <>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContainer}
          data={attendanceData}
          keyExtractor={(item) => `${item.courseId}-${item.date}`} // Ensure unique key
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <Text style={styles.courseTitle}>{item.courseName}</Text>
              <FlatList
                data={item.students}
                keyExtractor={(student) => `${student.username}-${item.date}`} // Ensure unique key
                renderItem={({ item: student }) => (
                  <View style={styles.studentRow}>
                    <Text style={styles.studentName}>{student.username}</Text>
                    <Text
                      style={[
                        styles.status,
                        { color: student.present ? '#27ae60' : '#c0392b' },
                      ]}
                    >
                      {student.present ? '✓ Present' : '✗ Absent'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No attendance records found</Text>
          }
        />
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Attendance - {courseName}</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              isViewMode && styles.activeSegmentButton,
            ]}
            onPress={() => setIsViewMode(true)}
          >
            <Text
              style={[
                styles.segmentButtonText,
                isViewMode && styles.activeSegmentButtonText,
              ]}
            >
              View Mode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              !isViewMode && styles.activeSegmentButton,
            ]}
            onPress={() => setIsViewMode(false)}
          >
            <Text
              style={[
                styles.segmentButtonText,
                !isViewMode && styles.activeSegmentButtonText,
              ]}
            >
              Mark Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {isViewMode ? (
        renderViewMode()
      ) : (
        <>
          <View style={styles.markButtons}>
            <TouchableOpacity
              style={[styles.markBtn, { backgroundColor: '#2ecc71' }]}
              onPress={() => markAll(true)}
            >
              <Text style={styles.markBtnText}>Mark All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.markBtn, { backgroundColor: '#e74c3c' }]}
              onPress={() => markAll(false)}
            >
              <Text style={styles.markBtnText}>Mark All Absent</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#2980b9" />
          ) : (
            <FlatList
              contentContainerStyle={styles.listContainer}
              data={students}
              keyExtractor={(item) => item._id} // Ensure unique key
              renderItem={({ item }) => (
                <View style={[
                  styles.studentCard,
                  attendance[item._id] ? styles.presentCard : styles.absentCard,
                ]}>
                  <TouchableOpacity
                    style={styles.studentCardContent}
                    onPress={() => toggleAttendance(item._id)}
                  >
                    <Text style={styles.studentText}>{item.username}</Text>
                    <Text style={styles.statusText}>
                      {attendance[item._id] ? '✔ Present' : '✘ Absent'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
          <TouchableOpacity style={styles.submitBtn} onPress={submitAttendance}>
            <Text style={styles.submitText}>Submit Attendance</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Mark Attendance for {selectedStudent?.username}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.presentButton]}
                onPress={() => selectedStudent && handleIndividualMarking(selectedStudent._id, true)}
              >
                <Text style={styles.modalButtonText}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.absentButton]}
                onPress={() => selectedStudent && handleIndividualMarking(selectedStudent._id, false)}
              >
                <Text style={styles.modalButtonText}>Absent</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceMarker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  presentButton: {
    backgroundColor: '#2ecc71',
  },
  absentButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#666666',
    textAlign: 'center',
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSegmentButton: {
    backgroundColor: '#2196F3',
  },
  segmentButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  activeSegmentButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    color: '#ffffff',
    marginLeft: 8,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  presentCard: {
    backgroundColor: '#f0f9f0',
    borderColor: '#4CAF50',
  },
  absentCard: {
    backgroundColor: '#fef8f8',
    borderColor: '#ff5252',
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  markButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  markBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  markBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  studentName: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  status: {
    fontSize: 14,
    color: '#666666',
  },
  listContainer: {
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666666',
    marginTop: 32,
  },
});
