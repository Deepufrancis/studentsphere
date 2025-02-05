import { Text, View, TextInput, Modal, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import Buttons from '../components/custombutton';
import styles from '../components/styles';
import axios from 'axios';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [descriptionInputValue, setDescriptionInputValue] = useState('');
  const [courses, setCourses] = useState<{ _id: string; name: string; description: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://10.10.33.26:5000/api/courses';

  // backend
  const fetchCourses = async () => {
    try {
      const response = await axios.get(API_URL);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
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
        fetchCourses(); // Refresh the list after adding/editing
        handleCloseModal();
      } catch (error) {
        console.error('Error saving course:', error);
      }
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
                <Buttons title="Edit" onPress={() => handleOpenModal(course._id)} style={styles.editButton} />
                <Buttons title="Delete" onPress={() => handleDelete(course._id)} style={styles.deleteButton} />
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

              <Buttons title="Submit" onPress={handleSubmit} style={styles.submitButton} />
              <Buttons title="Close" onPress={handleCloseModal} style={styles.closeButton} />
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>

      <View style={styles.fixedAddButtonContainer}>
        <Buttons title="+" onPress={() => handleOpenModal()} style={styles.addButton} textStyle={styles.addButtonText} />
      </View>
    </View>
  );
}
