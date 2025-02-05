import { View, TextInput, Modal, ScrollView, Alert, ActivityIndicator, Pressable, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [descriptionInputValue, setDescriptionInputValue] = useState('');
  const [courses, setCourses] = useState<{ _id: string; name: string; description: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://10.58.0.213:5000/api/courses';

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses. Please check your connection or server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      const course = courses.find(course => course._id === id);
      if (course) {
        setEditId(course._id);
        setTextInputValue(course.name);
        setDescriptionInputValue(course.description);
      }
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTextInputValue('');
    setDescriptionInputValue('');
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (textInputValue.trim() && descriptionInputValue.trim()) {
      try {
        if (editId) {
          await axios.put(`${API_URL}/${editId}`, {
            name: textInputValue,
            description: descriptionInputValue,
          });
        } else {
          await axios.post(API_URL, {
            name: textInputValue,
            description: descriptionInputValue,
          });
        }
        fetchCourses();
        handleCloseModal();
      } catch (error) {
        console.error('Error saving course:', error);
        Alert.alert('Error', 'Failed to save course. Please try again.');
      }
    } else {
      Alert.alert('Input Error', 'Course name and description cannot be empty.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Confirmation', 'Are you sure you want to delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/${id}`);
            fetchCourses();
          } catch (error) {
            console.error('Error deleting course:', error);
            Alert.alert('Error', 'Failed to delete course. Please try again.');
          }
        },
      },
    ]);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search courses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <View key={course._id} style={styles.courseItem}>
              <Text style={styles.courseName}>{course.name}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity onPress={() => handleOpenModal(course._id)} style={styles.editButton}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(course._id)} style={styles.deleteButton}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noCoursesText}>No courses found</Text>
        )}

        <Modal visible={isModalVisible} transparent={true} animationType="slide">
          <Pressable style={styles.modalBackground} onPress={handleCloseModal}>
            <Pressable style={styles.modalContainer} onPress={() => {}}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Course' : 'Add Course'}</Text>
              <TextInput
                value={textInputValue}
                onChangeText={setTextInputValue}
                placeholder="Enter course name"
                style={styles.input}
              />
              <TextInput
                value={descriptionInputValue}
                onChangeText={setDescriptionInputValue}
                placeholder="Enter course description"
                style={styles.input}
              />

              <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>

      <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addCourseButton}>
        <Text style={styles.addCourseButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgb(114, 114, 114)',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  courseItem: {
    backgroundColor: 'rgb(251, 251, 251)',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    elevation: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  courseDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noCoursesText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  addCourseButton: {
    backgroundColor: 'blue',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right:20,
    bottom: 20,
    alignSelf: 'center',
  },
  addCourseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
