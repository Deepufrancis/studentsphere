import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Modal, Platform, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  _id: string;
  courseName: string;
  description: string;
}

interface Exam {
  _id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  courseId: string;
}

const CreateExamScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [duration, setDuration] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // Add new state variables for edit and delete functionality
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editDuration, setEditDuration] = useState('');
  const [editShowPicker, setEditShowPicker] = useState(false);
  const [editMode, setEditMode] = useState<'date' | 'time'>('date');

  const fetchData = async () => {
    setLoading(true);
    try {
      const teacherUsername = await AsyncStorage.getItem('loggedInUser');
      console.log('Teacher username:', teacherUsername); // Add this line

      if (!teacherUsername) {
        setError('User not logged in');
        return;
      }

      // Fetch courses
      const coursesResponse = await fetch(`${API_BASE_URL}/courses?teacher=${teacherUsername}`);
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
        if (coursesData.length > 0 && !selectedCourseId) {
          setSelectedCourseId(coursesData[0]._id);
        }
      } else {
        console.error('Failed to fetch courses:', await coursesResponse.text());
      }

      // Fetch exams
      const examsResponse = await fetch(`${API_BASE_URL}/exams/teacher/${teacherUsername}`);
      console.log('Exams API response status:', examsResponse.status); // Add this line
      
      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        console.log('Fetched exams:', examsData); // Add this line
        setExams(examsData);
      } else {
        console.error('Failed to fetch exams:', await examsResponse.text());
        setError('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExam = async () => {
    if (!title || !description || !duration || !selectedCourseId) {
      Alert.alert('Error', 'Please fill all fields and select a course.');
      return;
    }

    try {
      const teacherUsername = await AsyncStorage.getItem('loggedInUser');
      
      const response = await fetch(`${API_BASE_URL}/exams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          date,
          duration: parseInt(duration),
          courseId: selectedCourseId,
          teacherUsername,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server returned error: ${response.status}`);
      }

      const data = await response.json();
      
      // Clear form fields
      setTitle('');
      setDescription('');
      setDate(new Date());
      setDuration('');
      
      // Close the modal
      setIsModalOpen(false);
      
      // Refresh the exam list
      fetchData();
      
      Alert.alert('Success', 'Exam created successfully.');
    } catch (error) {
      console.error('Error creating exam:', error);
      Alert.alert('Error', 'Server error. Please try again later.');
    }
  };

  const handleDateChange = (event: any, newDate?: Date) => {
    if (Platform.OS === 'android') {
      // Only set the date if user confirms
      if (event?.type === 'set' && newDate) {
        setDate(newDate);
      }
    } else {
      // iOS or other platforms
      if (newDate) {
        setDate(newDate);
      }
    }
    setShowPicker(false);
  };

  // Handle Edit Exam
  const handleEditExam = async () => {
    if (!editTitle || !editDescription || !editDuration || !selectedExam) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/exams/${selectedExam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          date: editDate,
          duration: parseInt(editDuration),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server returned error: ${response.status}`);
      }

      // Close the modal
      setIsEditModalOpen(false);
      
      // Refresh the exam list
      fetchData();
      
      Alert.alert('Success', 'Exam updated successfully.');
    } catch (error) {
      console.error('Error updating exam:', error);
      Alert.alert('Error', 'Failed to update exam. Please try again.');
    }
  };

  // Handle Delete Exam
  const handleDeleteExam = async () => {
    if (!selectedExam) return;

    try {
      const response = await fetch(`${API_BASE_URL}/exams/${selectedExam._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server returned error: ${response.status}`);
      }

      // Close the modal
      setIsDeleteModalOpen(false);
      
      // Refresh the exam list
      fetchData();
      
      Alert.alert('Success', 'Exam deleted successfully.');
    } catch (error) {
      console.error('Error deleting exam:', error);
      Alert.alert('Error', 'Failed to delete exam. Please try again.');
    }
  };

  // Function to open the edit modal with the selected exam's data
  const openEditModal = (exam: Exam) => {
    setSelectedExam(exam);
    setEditTitle(exam.title);
    setEditDescription(exam.description);
    setEditDate(new Date(exam.date));
    setEditDuration(exam.duration.toString());
    setIsEditModalOpen(true);
    setMenuVisible(null);
  };

  // Function to open the delete confirmation modal
  const openDeleteModal = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDeleteModalOpen(true);
    setMenuVisible(null);
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event?.type === 'set' && selectedDate) {
        setEditDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setEditDate(selectedDate);
      }
    }
    setEditShowPicker(false);
  };

  // Add this function to handle clicks outside the menu popup
  const handleOutsideClick = () => {
    if (menuVisible) {
      setMenuVisible(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TouchableWithoutFeedback onPress={handleOutsideClick}>
      <View style={styles.container}>
        <Text style={styles.header}>Exams</Text>

        {exams.length > 0 ? (
          <ScrollView style={styles.examList}>
            {exams.map((exam) => (
              <View key={exam._id} style={styles.examCard}>
                <TouchableOpacity 
                  style={styles.examContent}
                  onPress={() => {
                    try {
                      console.log('TouchableOpacity pressed');
                      if (!exam._id) {
                        console.error('No exam ID available');
                        return;
                      }
                      console.log('Navigating to exam:', exam._id);
                      router.push({
                        pathname: `/(teacher)/exams/${exam._id}`,
                      });
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                >
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examDescription}>{exam.description}</Text>
                  <View style={styles.examDetails}>
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.examDate}>
                        Date: {new Date(exam.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.examTime}>
                        Time: {new Date(exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.examDuration}>
                      Duration: {exam.duration} minutes
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setMenuVisible(menuVisible === exam._id ? null : exam._id);
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#555" />
                </TouchableOpacity>
                
                {menuVisible === exam._id && (
                  <View style={styles.menuPopup}>
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => openEditModal(exam)}
                    >
                      <Ionicons name="create-outline" size={18} color="#007BFF" />
                      <Text style={styles.menuItemText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.menuItem, styles.menuItemDanger]}
                      onPress={() => openDeleteModal(exam)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      <Text style={styles.menuItemTextDanger}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noExamsContainer}>
            <Text style={styles.noExamsText}>No exams created yet.</Text>
            <Text style={styles.noExamsSubtext}>Tap the + button to create your first exam.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <Modal visible={isModalOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Exam</Text>

              <View style={styles.courseSelectionContainer}>
                <Text style={styles.sectionTitle}>Select Course:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillContainer}
                >
                  {filteredCourses.map((course) => (
                    <TouchableOpacity
                      key={course._id}
                      style={[
                        styles.pill,
                        selectedCourseId === course._id && styles.selectedPill
                      ]}
                      onPress={() => setSelectedCourseId(course._id)}
                    >
                      <Text 
                        style={[
                          styles.pillText,
                          selectedCourseId === course._id && styles.selectedPillText
                        ]}
                      >
                        {course.courseName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Exam Title"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setMode('date');
                    setShowPicker(true);
                  }
                }}
              >
                <Text style={styles.dateText}>{date.toLocaleString()}</Text>
              </TouchableOpacity>

              {showPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) setDate(selectedDate);
                    if (mode === 'date' && event?.type === 'set') {
                      setMode('time');
                      setShowPicker(true);
                    }
                  }}
                />
              )}

              {Platform.OS === 'ios' && (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display="spinner"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Duration (in minutes)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />

              <TouchableOpacity onPress={handleCreateExam} style={styles.modalButton}>
                <Text style={styles.buttonText}>Create Exam</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Exam Modal */}
        <Modal visible={isEditModalOpen} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setIsEditModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Exam</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Exam Title"
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.datePicker}
                    onPress={() => {
                      if (Platform.OS === 'android') {
                        setEditMode('date');
                        setEditShowPicker(true);
                      }
                    }}
                  >
                    <Text style={styles.dateText}>{editDate.toLocaleString()}</Text>
                  </TouchableOpacity>

                  {editShowPicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={editDate}
                      mode={editMode}
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedDate) => {
                        setEditShowPicker(false);
                        if (selectedDate) setEditDate(selectedDate);
                        if (editMode === 'date' && event?.type === 'set') {
                          setEditMode('time');
                          setEditShowPicker(true);
                        }
                      }}
                    />
                  )}

                  {Platform.OS === 'ios' && isEditModalOpen && (
                    <DateTimePicker
                      value={editDate}
                      mode="datetime"
                      display="spinner"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setEditDate(selectedDate);
                      }}
                    />
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder="Duration (in minutes)"
                    value={editDuration}
                    onChangeText={setEditDuration}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity onPress={handleEditExam} style={styles.modalButton}>
                    <Text style={styles.buttonText}>Update Exam</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsEditModalOpen(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal visible={isDeleteModalOpen} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setIsDeleteModalOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.modalContent, styles.deleteModalContent]}>
                  <Text style={styles.modalTitle}>Delete Exam</Text>
                  
                  <Text style={styles.deleteText}>
                    Are you sure you want to delete this exam? This action cannot be undone.
                  </Text>

                  <View style={styles.deleteButtonsContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsDeleteModalOpen(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={handleDeleteExam}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CreateExamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  examDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  examDuration: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  examDetails: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTime: {
    fontSize: 14,
    color: '#555',
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  courseList: {
    maxHeight: 150,
  },
  courseItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedCourseItem: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  courseItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCourseItemText: {
    color: '#fff',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  noCourses: {
    textAlign: 'center',
    color: '#666',
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 15,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  searchInput: { 
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '500',
    paddingVertical: 8,
  },
  courseCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 5,
    borderColor: "#ddd",
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCourseCard: {
    borderColor: "#007BFF",
    backgroundColor: '#f0f8ff',
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  checkmark: {
    width: 30,
    alignItems: 'center',
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007BFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalCourseList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#007BFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: "gray",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  examList: {
    flex: 1,
  },
  courseSelectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPill: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3',
  },
  pillText: {
    fontSize: 14,
    color: '#333',
  },
  selectedPillText: {
    color: '#fff',
    fontWeight: '500',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 35,
    alignItems: 'center',
    width: '100%',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  examCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    position: 'relative',
  },
  examContent: {
    flex: 1,
  },
  menuButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  menuPopup: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemDanger: {
    marginTop: 5,
  },
  menuItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007BFF',
  },
  menuItemTextDanger: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
  },
  deleteModalContent: {
    maxHeight: 'auto',
    width: '80%',
  },
  deleteText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noExamsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noExamsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  noExamsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
