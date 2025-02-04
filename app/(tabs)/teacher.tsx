import { Text, View, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [descriptionInputValue, setDescriptionInputValue] = useState('');
  const [courses, setCourses] = useState<{ name: string; description: string }[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      const savedCourses = await AsyncStorage.getItem('courses');
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses));
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('courses', JSON.stringify(courses));
  }, [courses]);

  const handleOpenModal = (index: number | null = null) => {
    if (index !== null) {
      setEditIndex(index);
      setTextInputValue(courses[index].name);
      setDescriptionInputValue(courses[index].description);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTextInputValue('');
    setDescriptionInputValue('');
    setEditIndex(null);
  };

  const handleSubmit = () => {
    if (textInputValue.trim() && descriptionInputValue.trim()) {
      if (editIndex !== null) {
        const updatedCourses = [...courses];
        updatedCourses[editIndex] = { name: textInputValue, description: descriptionInputValue };
        setCourses(updatedCourses);
      } else {
        setCourses((prevCourses) => [...prevCourses, { name: textInputValue, description: descriptionInputValue }]);
      }
      handleCloseModal();
    }
  };

  const handleDelete = (index: number) => {
    Alert.alert('Delete Confirmation', 'Are you sure you want to delete this course?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setCourses((prevCourses) => prevCourses.filter((_, i) => i !== index)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {courses.length > 0 ? (
        courses.map((course, index) => (
          <View key={index} style={styles.courseItem}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => handleOpenModal(index)} style={styles.editButton}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(index)} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noCoursesText}>No courses added yet</Text>
      )}

      <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <Pressable style={styles.modalBackground} onPress={handleCloseModal}>
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Course</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 8,
    width: '100%',
    marginBottom: 10,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  courseItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
    borderRadius: 5,
    width: '100%',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '500',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  noCoursesText: {
    fontStyle: 'italic',
    color: 'gray',
    textAlign: 'center',
  },
});
