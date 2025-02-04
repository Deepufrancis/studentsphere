import { Text, View, TextInput, Modal, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Buttons from '../components/custombutton';
import { ScrollView } from 'react-native';
import styles from '../components/styles';

export default function Index() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [descriptionInputValue, setDescriptionInputValue] = useState('');
  const [courses, setCourses] = useState<{ name: string; description: string }[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>


      <TextInput
        style={styles.searchBar}
        placeholder="Search courses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filteredCourses.length > 0 ? (
        filteredCourses.map((course, index) => (
          <View key={index} style={styles.courseItem}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
            <View style={styles.buttonGroup}>
              <Buttons title="Edit" onPress={() => handleOpenModal(index)} style={styles.editButton} />
              <Buttons title="Delete" onPress={() => handleDelete(index)} style={styles.deleteButton} />
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noCoursesText}>No courses found</Text>
      )}

      <Buttons title="+" onPress={() => handleOpenModal()} style={styles.addButton} textStyle={styles.addButtonText} />

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <Pressable style={styles.modalBackground} onPress={handleCloseModal}>
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitle}>{editIndex !== null ? 'Edit Course' : 'Add Course'}</Text>
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
  );
}
