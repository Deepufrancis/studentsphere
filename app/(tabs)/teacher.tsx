import { Text, View, StyleSheet, TouchableOpacity, Modal, TextInput, Pressable } from 'react-native';
import { useState } from 'react';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [courses, setCourses] = useState<string[]>([]);

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = () => {
    if (textInputValue.trim()) {
      setCourses([...courses, textInputValue]);
      setTextInputValue('');
      setIsModalVisible(false);
    }
  };

  const handleDelete = (index: number) => {
    const updatedCourses = courses.filter((_, i) => i !== index);
    setCourses(updatedCourses);
  };

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalBackground} onPress={handleCloseModal}>
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitle}>Add Course</Text>
            <TextInput
              value={textInputValue}
              onChangeText={setTextInputValue}
              placeholder="Enter course name"
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

      <View style={styles.courseList}>
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <View key={index} style={styles.courseItem}>
              <Text style={styles.courseName}>{course}</Text>
              <TouchableOpacity
                onPress={() => handleDelete(index)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noCoursesText}>No courses added yet</Text>
        )}
      </View>

      <TouchableOpacity onPress={handleOpenModal} style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
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
  courseList: {
    marginTop: 20,
    width: '100%',
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noCoursesText: {
    fontStyle: 'italic',
    color: 'gray',
    textAlign: 'center',
  },
});
