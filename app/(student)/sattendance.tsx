import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

interface AttendanceRecord {
  course: string;
  date: string;
  present: boolean;
}

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const fetchAttendance = async (studentUsername: string) => {
    try {
      if (!studentUsername) {
        throw new Error('No username found');
      }

      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/attendance/student/${encodeURIComponent(studentUsername)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance');
      }
      
      const data = await response.json();
      // Sort attendance by date (most recent first)
      const sortedData = data.sort((a: AttendanceRecord, b: AttendanceRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAttendance(sortedData);
    } catch (error: any) {
      console.error('Attendance fetch error:', error);
      Alert.alert('Error', error.message || 'Failed to load attendance records');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('loggedInUser');
        if (!storedUsername) {
          throw new Error('User not logged in');
        }
        setUsername(storedUsername);
        await fetchAttendance(storedUsername);
      } catch (error: any) {
        console.error('Initialization error:', error);
        Alert.alert('Error', error.message || 'Failed to load user data');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={[
      styles.attendanceCard,
      item.present ? styles.presentCard : styles.absentCard
    ]}>
      <Text style={styles.courseTitle}>{item.course}</Text>
      <View style={styles.detailsRow}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={[
          styles.statusText,
          { color: item.present ? '#4CAF50' : '#FF5252' }
        ]}>
          {item.present ? '✓ Present' : '✗ Absent'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Attendance</Text>
      <FlatList
        data={attendance}
        renderItem={renderAttendanceItem}
        keyExtractor={(item, index) => `${item.course}-${item.date}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  attendanceCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  presentCard: {
    backgroundColor: '#f0f9f0',
    borderColor: '#4CAF50',
  },
  absentCard: {
    backgroundColor: '#fef8f8',
    borderColor: '#FF5252',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 32,
  },
});

export default StudentAttendance;
