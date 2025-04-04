import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  RefreshControl,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants";
import { Linking } from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo/vector-icons
import { Picker } from '@react-native-picker/picker';

const LiveClassLinksScreen = () => {
  interface LiveClass {
    _id: string;
    courseId: {
      _id: string;
      courseName: string;
      description: string;
    };
    liveClassLink: string;
    scheduledTime: string;
  }

  interface Course {
    _id: string;
    courseName: string;
    description: string;
  }

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [newLink, setNewLink] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteSuccessModalVisible, setIsDeleteSuccessModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // Add this state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [editScheduledTime, setEditScheduledTime] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('upcoming'); // 'upcoming' or 'later'
  const [filterCourse, setFilterCourse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLiveClasses = async (teacherUsername: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/liveclass/${teacherUsername}`);
      setLiveClasses(response.data);
    } catch (err) {
      setError("Failed to fetch live classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    const getTeacherUsername = async () => {
      try {
        const username = await AsyncStorage.getItem("loggedInUser");
        if (username) {
          fetchLiveClasses(username);
          fetchCourses(username);
        } else {
          setError("No teacher username found.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error retrieving username.");
        setLoading(false);
      }
    };
    getTeacherUsername();
  }, []);

  const handleSaveLink = async (classId: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/liveclass/${classId}`, { 
        liveClassLink: newLink,
        scheduledTime: editScheduledTime 
      });
      setLiveClasses((prev) =>
        prev.map((liveClass) =>
          liveClass._id === classId ? response.data : liveClass
        )
      );
      setEditingClass(null);
      setNewLink("");
      setIsSuccessModalVisible(true);
      setTimeout(() => setIsSuccessModalVisible(false), 2000); // Auto hide after 2 seconds
    } catch (err) {
      Alert.alert("Error", "Failed to update live class link.");
    }
  };

  const handleDeleteLink = (classId: string) => {
    setDeleteTargetId(classId);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    try {
      setDeleteLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/liveclass/${deleteTargetId}`);
      
      if (response.data.success) {
        setLiveClasses((prev) =>
          prev.filter((liveClass) => liveClass._id !== deleteTargetId)
        );
        setIsDeleteModalVisible(false);
        setIsDeleteSuccessModalVisible(true);
        setTimeout(() => {
          setIsDeleteSuccessModalVisible(false);
          setDeleteTargetId(null);
        }, 2000);
      }
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to delete live class. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddNewLink = async () => {
    try {
      const username = await AsyncStorage.getItem("loggedInUser");
      const response = await axios.post(`${API_BASE_URL}/liveclass`, {
        courseId: selectedCourse,
        teacher: username,
        liveClassLink: newLink,
        scheduledTime: scheduledTime
      });
      setLiveClasses(prev => [...prev, response.data]);
      setIsModalVisible(false);
      setNewLink("");
      setSelectedCourse(null);
    } catch (err) {
      Alert.alert("Error", "Failed to add live class link.");
    }
  };

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);
    if (selectedDate) setScheduledTime(selectedDate);
  }
  
  function handleTimeChange(event: any, selectedTime?: Date) {
    setShowTimePicker(false);
    if (selectedTime) setScheduledTime(selectedTime);
  }

  function handleEditDateChange(event: any, selectedDate?: Date) {
    setShowEditDatePicker(false);
    if (selectedDate) setEditScheduledTime(selectedDate);
  }
  
  function handleEditTimeChange(event: any, selectedTime?: Date) {
    setShowEditTimePicker(false);
    if (selectedTime) setEditScheduledTime(selectedTime);
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const refresh = async () => {
      const username = await AsyncStorage.getItem("loggedInUser");
      if (username) {
        await fetchLiveClasses(username);
        await fetchCourses(username);
      }
      setRefreshing(false);
    };
    refresh();
  }, []);

  const getSortedAndFilteredClasses = () => {
    let filtered = [...liveClasses];
    
    // Apply course filter
    if (filterCourse !== 'all') {
      filtered = filtered.filter(cls => cls.courseId._id === filterCourse);
    }
    
    // Apply date sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledTime).getTime();
      const dateB = new Date(b.scheduledTime).getTime();
      const now = new Date().getTime();
      
      if (sortOrder === 'upcoming') {
        // Upcoming first: closest future dates first
        const diffA = Math.abs(dateA - now);
        const diffB = Math.abs(dateB - now);
        return diffA - diffB;
      } else {
        // Later first: furthest dates first
        return dateB - dateA;
      }
    });
    
    return filtered;
  };

  const filterButtons = [
    { id: 'upcoming', label: 'Upcoming First', icon: 'time-outline' },
    { id: 'later', label: 'Later First', icon: 'calendar-outline' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Class Links</Text>
      <View style={styles.filterBar}>
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.filterToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="funnel-outline" size={18} color="#007AFF" />
            <Text style={styles.filterToggleText}>Filter</Text>
            <Ionicons 
              name={showFilters ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          
          <View style={styles.sortButtons}>
            {filterButtons.map(button => (
              <TouchableOpacity
                key={button.id}
                style={[
                  styles.sortButton,
                  sortOrder === button.id && styles.sortButtonActive
                ]}
                onPress={() => setSortOrder(button.id)}
              >
                <Ionicons 
                  name={button.icon} 
                  size={16} 
                  color={sortOrder === button.id ? '#fff' : '#007AFF'} 
                />
                <Text style={[
                  styles.sortButtonText,
                  sortOrder === button.id && styles.sortButtonTextActive
                ]}>
                  {button.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {showFilters && (
          <View style={styles.filterDropdown}>
            <Text style={styles.filterLabel}>Course:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.courseFilterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.courseFilterPill,
                  filterCourse === 'all' && styles.courseFilterPillActive
                ]}
                onPress={() => setFilterCourse('all')}
              >
                <Text style={[
                  styles.courseFilterText,
                  filterCourse === 'all' && styles.courseFilterTextActive
                ]}>All Courses</Text>
              </TouchableOpacity>
              {courses.map(course => (
                <TouchableOpacity
                  key={course._id}
                  style={[
                    styles.courseFilterPill,
                    filterCourse === course._id && styles.courseFilterPillActive
                  ]}
                  onPress={() => setFilterCourse(course._id)}
                >
                  <Text style={[
                    styles.courseFilterText,
                    filterCourse === course._id && styles.courseFilterTextActive
                  ]}>{course.courseName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={getSortedAndFilteredClasses()}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <View style={styles.cardHeader}>
                <View style={styles.headerContent}>
                  <Text style={styles.courseName}>{item.courseId.courseName}</Text>
                  <Text style={styles.courseDescription}>{item.courseId.description}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => setMenuVisible(menuVisible === item._id ? null : item._id)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#555" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.dateTimeLabel}>Date:</Text>
                    <Text style={styles.dateTimeValue}>
                      {new Date(item.scheduledTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.dateTimeLabel}>Time:</Text>
                    <Text style={styles.dateTimeValue}>
                      {new Date(item.scheduledTime).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                {item.liveClassLink && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => Linking.openURL(item.liveClassLink)}
                  >
                    <Ionicons name="videocam" size={18} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.linkText}>Join Live Class</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Menu Modal */}
              {menuVisible === item._id && (
                <TouchableOpacity 
                  style={styles.menuModalOverlay}
                  activeOpacity={1}
                  onPress={() => setMenuVisible(null)}
                >
                  <TouchableOpacity 
                    style={styles.menuModal}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => {
                        setEditingClass(item._id);
                        setNewLink(item.liveClassLink || "");
                        setEditScheduledTime(new Date(item.scheduledTime));
                        setIsEditModalVisible(true);
                        setMenuVisible(null);
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" style={styles.menuIcon} />
                      <Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.menuItem, styles.menuItemDanger]}
                      onPress={() => {
                        handleDeleteLink(item._id);
                        setMenuVisible(null);
                      }}
                    >
                      <Ionicons name="trash" size={16} color="#FF3B30" style={styles.menuIcon} />
                      <Text style={[styles.menuText, {color: '#FF3B30'}]}>Delete</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {!item.liveClassLink && !editingClass && (
                <TouchableOpacity style={styles.addButton} onPress={() => setEditingClass(item._id)}>
                  <Ionicons name="add-circle" size={18} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Add Live Class Link</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalHeader}>Add New Live Class</Text>
            
            <Text style={styles.label}>Select Course</Text>
            <View style={styles.courseSelector}>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={[
                    styles.coursePill,
                    selectedCourse === course._id && styles.selectedCoursePill
                  ]}
                  onPress={() => setSelectedCourse(course._id)}
                >
                  <Text style={[
                    styles.coursePillText,
                    selectedCourse === course._id && styles.selectedPillText
                  ]}>
                    {course.courseName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, styles.linkLabel]}>Live Class Link</Text>
            <View style={styles.linkContainer}>
              <Ionicons name="link-outline" size={20} color="#666" style={styles.linkIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter meeting link (Zoom, Meet, etc.)"
                value={newLink}
                onChangeText={setNewLink}
              />
            </View>
            
            <Text style={styles.label}>Scheduled Time</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datePickerButtonText}>Select Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.datePickerButtonText}>Select Time</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
            <Text style={styles.selectedDateTime}>
              Selected: {scheduledTime.toLocaleString()}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={handleAddNewLink}
              >
                <Text style={styles.buttonText}>Add Class</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isSuccessModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.successModalContainer}
          activeOpacity={1}
          onPress={() => setIsSuccessModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.successModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.successModalText}>Link updated successfully!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsDeleteModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalHeader}>Delete Live Class</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this live class?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Delete</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setDeleteTargetId(null);
                }}
                disabled={deleteLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Success Modal */}
      <Modal
        visible={isDeleteSuccessModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDeleteSuccessModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.successModalContainer}
          activeOpacity={1}
          onPress={() => setIsDeleteSuccessModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.successModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.successModalText}>Live class deleted successfully!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsEditModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalHeader}>Edit Live Class</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter Live Class Link"
              value={newLink}
              onChangeText={setNewLink}
            />
            
            <Text style={[styles.label, styles.linkLabel]}>Live Class Link</Text>
            <View style={styles.linkContainer}>
              <Ionicons name="link-outline" size={20} color="#666" style={styles.linkIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter meeting link (Zoom, Meet, etc.)"
                value={newLink}
                onChangeText={setNewLink}
              />
            </View>

            <Text style={styles.label}>Update Scheduled Time</Text>
            <TouchableOpacity onPress={() => setShowEditDatePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.datePickerButtonText}>Select New Date</Text>
            </TouchableOpacity>
            {showEditDatePicker && (
              <DateTimePicker
                value={editScheduledTime}
                mode="date"
                display="default"
                onChange={handleEditDateChange}
              />
            )}
            <TouchableOpacity onPress={() => setShowEditTimePicker(true)} style={styles.datePickerButton}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.datePickerButtonText}>Select New Time</Text>
            </TouchableOpacity>
            {showEditTimePicker && (
              <DateTimePicker
                value={editScheduledTime}
                mode="time"
                display="default"
                onChange={handleEditTimeChange}
              />
            )}
            <Text style={styles.selectedDateTime}>
              New Schedule: {editScheduledTime.toLocaleString()}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingClass(null);
                }}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  handleSaveLink(editingClass);
                  setIsEditModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  courseCard: { 
    backgroundColor: "#fff", 
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerContent: {
    flex: 1,
    marginRight: 10,
  },
  cardContent: {
    padding: 16,
  },
  menuButton: {
    padding: 4,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
  },
  courseName: { 
    fontSize: 18, 
    fontWeight: "600",
    color: '#2c3e50',
    marginBottom: 4,
  },
  courseDescription: { 
    fontSize: 14, 
    color: "#666",
    marginBottom: 8,
  },
  dateTimeContainer: {
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '600',
    marginRight: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  linkButton: { 
    backgroundColor: "#007AFF", 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // Make it pill-shaped
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    marginTop: 15,
    marginHorizontal: 10,
  },
  linkText: { 
    color: "#fff", 
    fontWeight: "700", // Made slightly bolder
    fontSize: 15,
    letterSpacing: 0.5, // Added letter spacing for better readability
  },
  menuModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  menuModal: {
    position: 'absolute',
    right: 10,
    top: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 14,
    color: '#007AFF',
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
 
  editButton: { backgroundColor: "#FFA500", padding: 10, marginTop: 5, borderRadius: 5 },
  deleteButton: { backgroundColor: "#FF3B30", padding: 10, marginTop: 5, borderRadius: 5 },
  addButton: { 
    backgroundColor: "#28a745", 
    padding: 12, 
    marginTop: 10, 
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: { backgroundColor: "#007AFF", padding: 10, marginTop: 10, borderRadius: 5 },
  cancelButton: { backgroundColor: "gray", padding: 10, marginTop: 5, borderRadius: 5 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  input: {
    borderWidth: 1.5,
    borderColor: '#e1e1e1',
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
   
  },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  scheduledTime: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic"
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
 
  // Update the text color for cancel button
  cancelButtonText: {
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  courseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  coursePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
  },
  selectedCoursePill: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    transform: [{ scale: 1.05 }],
  },
  coursePillText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedPillText: {
    color: '#fff',
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successModalContent: {
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e1e1e1',
  },
  datePickerButtonText: {
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  selectedDateTime: {
    marginTop: 12,
    color: '#2c3e50',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  linkLabel: {
    marginTop: 24,
    color: '#1a1a1a',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  linkIcon: {
    marginRight: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  filterButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '600',
  },
  filterOptions: {
    marginTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    width: 70,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 4,
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 13,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  coursePicker: {
    height: 40,
    backgroundColor: '#f8f9fa',
  },
  filterBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterSection: {
    padding: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterToggleText: {
    color: '#007AFF',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  filterDropdown: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  courseFilterScroll: {
    flexGrow: 0,
  },
  courseFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.05)',
    marginRight: 8,
  },
  courseFilterPillActive: {
    backgroundColor: '#007AFF',
  },
  courseFilterText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  courseFilterTextActive: {
    color: '#fff',
  },
});
export default LiveClassLinksScreen;