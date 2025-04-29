import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform, TextInput, Modal } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import XLSX from "xlsx";
import { API_BASE_URL } from "../constants";
import useUserData from '../hooks/getUserName';

const CreateClassroom = () => {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const { username, error, isLoading } = useUserData();

  // New classroom states
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'excel'
  const [manualStudents, setManualStudents] = useState([
    { name: '', email: '', rollNumber: '' }
  ]);
  const [isDataPreviewVisible, setIsDataPreviewVisible] = useState(false);
  const [columnMap, setColumnMap] = useState({
    name: -1,
    email: -1,
    rollNumber: -1
  });

  // Add new state
  const [viewingClassroom, setViewingClassroom] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  const [isCoursesModalVisible, setIsCoursesModalVisible] = useState(false);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', description: '', schedule: '' });

  const pickExcelFile = async () => {
    try {
      // Using a more specific mime type for Excel files might help
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/octet-stream", // Fallback for some devices
        ],
      });

      console.log("Picker Result:", result);

      // The API returns cancelled as "cancel" not "cancelled"
      if (result.canceled === true) {
        console.log("User cancelled file picking");
        Alert.alert("Cancelled", "You cancelled file picking.");
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert("File picked", file.name);
        setFileUri(file.uri);
        setFileName(file.name);
        setSheetData([]);
      } else if (result.type === "success") {
        // Handle older version of DocumentPicker API
        Alert.alert("File picked", result.name);
        setFileUri(result.uri);
        setFileName(result.name);
        setSheetData([]);
      } else {
        console.log("Unknown result format:", result);
        Alert.alert("Error", "Couldn't process the selected file.");
      }
    } catch (error) {
      console.error("Error during file picking:", error);
      Alert.alert("Error", error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const extractData = async () => {
    if (!fileUri) {
      Alert.alert("No file selected", "Please pick a file first.");
      return;
    }

    try {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(base64, { type: "base64" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log("Extracted data:", data);
      Alert.alert("Extraction Success", `Rows: ${data.length}`);
      setSheetData(data);
      setIsDataPreviewVisible(true);
    } catch (err) {
      console.error("Extraction error:", err);
      Alert.alert("Error extracting file", err.message);
    }
  };

  const fetchClassrooms = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/classroom/${username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch classrooms');
      }
      const data = await response.json();
      setClassrooms(data);
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      Alert.alert('Error', 'Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };
  
  // Add function to remove a student from classroom
  const handleRemoveStudent = async (classroomId, studentIndex) => {
    try {
      Alert.alert(
        "Remove Student",
        "Are you sure you want to remove this student?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Remove", 
            style: "destructive",
            onPress: async () => {
              const response = await fetch(`${API_BASE_URL}/classroom/student/${classroomId}/${studentIndex}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                throw new Error('Failed to remove student');
              }
              
              const result = await response.json();
              
              // Update the viewing classroom with the updated data
              setViewingClassroom(result.classroom);
              
              // Also update the classrooms list
              fetchClassrooms();
              
              Alert.alert("Success", "Student removed successfully");
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error removing student:', err);
      Alert.alert('Error', 'Failed to remove student');
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [username]);

  const handleEditClassroom = (classroom) => {
    setEditingClassroom(classroom);
    setClassName(classroom.className);
    setSection(classroom.section);
    if (classroom.students.length > 0) {
      setSheetData([
        ['Name', 'Email', 'Roll Number'],
        ...classroom.students.map(s => [s.name, s.email, s.rollNumber])
      ]);
    }
    setIsModalVisible(true);
  };

  // Add new function to fetch classroom details
  const handleViewClassroom = async (classroom) => {
    try {
      const response = await fetch(`${API_BASE_URL}/classroom/details/${classroom._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch classroom details');
      }
      const data = await response.json();
      setViewingClassroom(data);
      setIsViewModalVisible(true);
    } catch (err) {
      console.error('Error fetching classroom details:', err);
      Alert.alert('Error', 'Failed to fetch classroom details');
    }
  };

  const addNewStudent = () => {
    setManualStudents([...manualStudents, { name: '', email: '', rollNumber: '' }]);
  };

  const updateStudent = (index, field, value) => {
    const updatedStudents = [...manualStudents];
    updatedStudents[index][field] = value;
    setManualStudents(updatedStudents);
  };

  const removeStudent = (index) => {
    if (manualStudents.length > 1) {
      const updatedStudents = manualStudents.filter((_, i) => i !== index);
      setManualStudents(updatedStudents);
    }
  };

  const processSelectedColumns = () => {
    if (sheetData.length < 2) return [];
    
    try {
      const processedData = sheetData.slice(1).map(row => {
        // Check if row exists and has proper indexes
        if (!row) return { name: '', email: '', rollNumber: '' };
        
        return {
          name: columnMap.name >= 0 && row[columnMap.name] !== undefined ? row[columnMap.name] : '',
          email: columnMap.email >= 0 && row[columnMap.email] !== undefined ? row[columnMap.email] : '',
          rollNumber: columnMap.rollNumber >= 0 && row[columnMap.rollNumber] !== undefined ? row[columnMap.rollNumber] : ''
        };
      });

      // Filter out empty rows
      return processedData.filter(student => 
        student.name || student.email || student.rollNumber
      );
    } catch (error) {
      console.error("Error processing Excel data:", error);
      Alert.alert("Error", "There was a problem processing the Excel data. Please check the file format.");
      return [];
    }
  };

  const handleCreateClassroom = async () => {
    if (!className || !section) {
      Alert.alert('Error', 'Please fill all the required fields');
      return;
    }
    
    // Additional validation for student data
    let students = [];
    
    try {
      if (inputMethod === 'excel') {
        students = processSelectedColumns();
        if (students.length === 0 && sheetData.length > 1) {
          Alert.alert('Warning', 'No valid student data was found in the Excel file or selected columns. Please check your column mapping.');
          return;
        }
      } else {
        students = manualStudents.filter(s => s.name || s.email || s.rollNumber);
        if (students.length === 0) {
          Alert.alert('Warning', 'Please add at least one student with some information.');
          return;
        }
      }

      const url = editingClassroom 
        ? `${API_BASE_URL}/classroom/edit/${editingClassroom._id}`
        : `${API_BASE_URL}/classroom/create`;

      const response = await fetch(url, {
        method: editingClassroom ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherUsername: username,
          className,
          section,
          students
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save classroom');
      }

      Alert.alert('Success', `Classroom ${editingClassroom ? 'updated' : 'created'} successfully!`);
      fetchClassrooms();
      setClassName('');
      setSection('');
      setSheetData([]);
      setFileUri(null);
      setFileName(null);
      setEditingClassroom(null);
      setIsModalVisible(false);
    } catch (err) {
      console.error('Error saving classroom:', err);
      Alert.alert('Error', 'Failed to save classroom');
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingClassroom(null);
    setClassName('');
    setSection('');
    setSheetData([]);
    setFileUri(null);
    setFileName(null);
    setManualStudents([{ name: '', email: '', rollNumber: '' }]);
    setInputMethod('manual');
  };

  const handleAddCourse = () => {
    if (!newCourse.name) {
      Alert.alert('Error', 'Course name is required');
      return;
    }
    setCourses([...courses, newCourse]);
    setNewCourse({ name: '', description: '', schedule: '' });
  };

  const handleSaveCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/classroom/courses/${viewingClassroom._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courses }),
      });

      if (!response.ok) {
        throw new Error('Failed to save courses');
      }

      Alert.alert('Success', 'Courses updated successfully');
      setIsCoursesModalVisible(false);
      fetchClassrooms();
    } catch (err) {
      console.error('Error saving courses:', err);
      Alert.alert('Error', 'Failed to save courses');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>Classroom Management</Text>
        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.createBtnText}>+ New Classroom</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={[styles.userInfo, styles.error]}>{error}</Text>
      ) : isLoading ? (
        <Text style={styles.userInfo}>Loading user data...</Text>
      ) : username ? (
        <View style={styles.welcomeBar}>
          <Text style={styles.welcomeText}>Welcome, Professor {username}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Your Classrooms</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading classrooms...</Text>
        </View>
      ) : classrooms.length > 0 ? (
        <ScrollView style={styles.classroomList}>
          {classrooms.map((classroom) => (
            <View key={classroom._id} style={styles.classroomCard}>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>{classroom.section}</Text>
              </View>
              <View style={styles.classroomHeader}>
                <View>
                  <Text style={styles.classroomName}>{classroom.className}</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statCount}>{classroom.students.length}</Text>
                      <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statCount}>{classroom.courses?.length || 0}</Text>
                      <Text style={styles.statLabel}>Courses</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.cardButtons}>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleViewClassroom(classroom)}
                >
                  <Text style={styles.buttonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => handleEditClassroom(classroom)}
                >
                  <Text style={styles.buttonText}>Edit Class</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.coursesButton}
                  onPress={() => {
                    setViewingClassroom(classroom);
                    setCourses(classroom.courses || []);
                    setIsCoursesModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Manage Courses</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.noClassrooms}>No classrooms created yet</Text>
          <Text style={styles.emptyStateSubtitle}>Create your first classroom to get started</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.emptyStateButtonText}>Create Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>
              {editingClassroom ? 'Edit Classroom' : 'Create New Classroom'}
            </Text>
            
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Class Name"
                value={className}
                onChangeText={setClassName}
              />
              <TextInput
                style={styles.input}
                placeholder="Section"
                value={section}
                onChangeText={setSection}
              />
              <View style={styles.inputMethodToggle}>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    inputMethod === 'manual' && styles.toggleButtonActive
                  ]}
                  onPress={() => setInputMethod('manual')}
                >
                  <Text style={styles.toggleButtonText}>Manual Entry</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton,
                    inputMethod === 'excel' && styles.toggleButtonActive
                  ]}
                  onPress={() => setInputMethod('excel')}
                >
                  <Text style={styles.toggleButtonText}>Excel Import</Text>
                </TouchableOpacity>
              </View>

              {inputMethod === 'manual' ? (
                <View style={styles.manualInputContainer}>
                  <ScrollView style={styles.studentsList}>
                    {manualStudents.map((student, index) => (
                      <View key={index} style={styles.studentInputRow}>
                        <TextInput
                          style={styles.studentInput}
                          placeholder="Name"
                          value={student.name}
                          onChangeText={(value) => updateStudent(index, 'name', value)}
                        />
                        <TextInput
                          style={styles.studentInput}
                          placeholder="Email"
                          value={student.email}
                          onChangeText={(value) => updateStudent(index, 'email', value)}
                        />
                        <TextInput
                          style={styles.studentInput}
                          placeholder="Roll No"
                          value={student.rollNumber}
                          onChangeText={(value) => updateStudent(index, 'rollNumber', value)}
                        />
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => removeStudent(index)}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.addButton} onPress={addNewStudent}>
                    <Text style={styles.addButtonText}>+ Add Student</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.subHeading}>Upload Student List</Text>
                  <TouchableOpacity style={styles.button} onPress={pickExcelFile}>
                    <Text style={styles.buttonText}>Pick Excel File</Text>
                  </TouchableOpacity>

                  {fileName && <Text style={styles.fileName}>Selected: {fileName}</Text>}

                  <ScrollView style={styles.scrollView}>
                    <View>
                      {sheetData.map((row, i) => (
                        <View key={i} style={styles.row}>
                          {row.map((cell, j) => (
                            <Text key={j} style={[styles.cell, i === 0 && styles.header]}>
                              {cell}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  {fileName && (
                    <>
                      <Text style={styles.fileName}>Selected: {fileName}</Text>
                      <TouchableOpacity style={styles.extractButton} onPress={extractData}>
                        <Text style={styles.buttonText}>Extract & Preview Data</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCloseModal}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.createButton]} 
                onPress={handleCreateClassroom}
              >
                <Text style={styles.buttonText}>{editingClassroom ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDataPreviewVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDataPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Map Excel Columns</Text>
            
            {sheetData.length > 0 && (
              <View style={styles.columnMappingContainer}>
                <View style={styles.mappingRow}>
                  <Text style={styles.mappingLabel}>Name Column:</Text>
                  <ScrollView horizontal style={styles.columnPicker}>
                    <TouchableOpacity 
                      style={[styles.columnOption, columnMap.name === -1 && styles.columnOptionSelected]}
                      onPress={() => setColumnMap({...columnMap, name: -1})}
                    >
                      <Text style={styles.columnOptionText}>None</Text>
                    </TouchableOpacity>
                    {sheetData[0].map((header, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.columnOption, columnMap.name === index && styles.columnOptionSelected]}
                        onPress={() => setColumnMap({...columnMap, name: index})}
                      >
                        <Text style={styles.columnOptionText}>{header}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.mappingRow}>
                  <Text style={styles.mappingLabel}>Email Column:</Text>
                  <ScrollView horizontal style={styles.columnPicker}>
                    <TouchableOpacity 
                      style={[styles.columnOption, columnMap.email === -1 && styles.columnOptionSelected]}
                      onPress={() => setColumnMap({...columnMap, email: -1})}
                    >
                      <Text style={styles.columnOptionText}>None</Text>
                    </TouchableOpacity>
                    {sheetData[0].map((header, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.columnOption, columnMap.email === index && styles.columnOptionSelected]}
                        onPress={() => setColumnMap({...columnMap, email: index})}
                      >
                        <Text style={styles.columnOptionText}>{header}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.mappingRow}>
                  <Text style={styles.mappingLabel}>Roll Number Column:</Text>
                  <ScrollView horizontal style={styles.columnPicker}>
                    <TouchableOpacity 
                      style={[styles.columnOption, columnMap.rollNumber === -1 && styles.columnOptionSelected]}
                      onPress={() => setColumnMap({...columnMap, rollNumber: -1})}
                    >
                      <Text style={styles.columnOptionText}>None</Text>
                    </TouchableOpacity>
                    {sheetData[0].map((header, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.columnOption, columnMap.rollNumber === index && styles.columnOptionSelected]}
                        onPress={() => setColumnMap({...columnMap, rollNumber: index})}
                      >
                        <Text style={styles.columnOptionText}>{header}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            <ScrollView style={styles.previewScrollView}>
              {processSelectedColumns().map((student, i) => (
                <View key={i} style={styles.previewRow}>
                  <Text style={styles.previewCell}>{student.name}</Text>
                  <Text style={styles.previewCell}>{student.email}</Text>
                  <Text style={styles.previewCell}>{student.rollNumber}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.previewButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setIsDataPreviewVisible(false);
                  setColumnMap({ name: -1, email: -1, rollNumber: -1 });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]}
                onPress={() => setIsDataPreviewVisible(false)}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isViewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsViewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {viewingClassroom && (
              <>
                <Text style={styles.modalHeading}>Classroom Details</Text>
                <View style={styles.detailsContainer}>
                  <Text style={styles.detailLabel}>Class Name:</Text>
                  <Text style={styles.detailValue}>{viewingClassroom.className}</Text>
                  
                  <Text style={styles.detailLabel}>Section:</Text>
                  <Text style={styles.detailValue}>{viewingClassroom.section}</Text>
                  
                  <Text style={styles.detailLabel}>Total Students:</Text>
                  <Text style={styles.detailValue}>{viewingClassroom.students.length}</Text>
                  
                  <Text style={styles.studentListHeader}>Students List:</Text>
                  <ScrollView style={styles.studentListScroll}>
                    {viewingClassroom.students.map((student, index) => (
                      <View key={index} style={styles.studentListItem}>
                        <View style={styles.studentInfoContainer}>
                          <Text style={styles.studentName}>{student.name || 'N/A'}</Text>
                          <Text style={styles.studentEmail}>{student.email || 'No email'}</Text>
                          <Text style={styles.studentRoll}>Roll: {student.rollNumber || 'Not assigned'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.studentRemoveButton}
                          onPress={() => handleRemoveStudent(viewingClassroom._id, index)}
                        >
                          <Text style={styles.studentRemoveButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity 
                  style={[styles.button, styles.closeButton]}
                  onPress={() => setIsViewModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCoursesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCoursesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Manage Courses</Text>
            
            <View style={styles.courseForm}>
              <TextInput
                style={styles.input}
                placeholder="Course Name"
                value={newCourse.name}
                onChangeText={(text) => setNewCourse({...newCourse, name: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={newCourse.description}
                onChangeText={(text) => setNewCourse({...newCourse, description: text})}
              />
              <TextInput
                style={styles.input}
                placeholder="Schedule"
                value={newCourse.schedule}
                onChangeText={(text) => setNewCourse({...newCourse, schedule: text})}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>
                <Text style={styles.addButtonText}>Add Course</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.courseList}>
              {courses.map((course, index) => (
                <View key={index} style={styles.courseItem}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDescription}>{course.description}</Text>
                  <Text style={styles.courseSchedule}>{course.schedule}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsCoursesModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]}
                onPress={handleSaveCourses}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 40, 
    backgroundColor: "#f5f7fa" 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: '#263238',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 10,
    color: '#455a64',
  },
  welcomeBar: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  welcomeText: {
    fontSize: 16,
    color: '#1565c0',
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  buttonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontSize: 16,
    fontWeight: "500", 
  },
  fileName: { 
    marginTop: 10, 
    fontStyle: "italic", 
    textAlign: "center" 
  },
  scrollView: { marginTop: 20 },
  row: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderColor: "#eee" 
  },
  cell: {
    padding: 8,
    minWidth: 100,
    borderRightWidth: 1,
    borderColor: "#eee",
    fontSize: 14,
  },
  header: {
    fontWeight: "bold",
    backgroundColor: "#f1f1f1",
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  error: {
    color: 'red',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#455a64',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    marginTop: 20,
    elevation: 2,
  },
  createBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '90%',
    elevation: 5,
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#263238',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ff5252',
    flex: 1,
    marginRight: 10,
    elevation: 2,
  },
  classroomList: {
    flex: 1,
    marginTop: 10,
  },
  classroomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    elevation: 2,
    position: 'relative',
  },
  cardBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#7e57c2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  classroomHeader: {
    marginBottom: 15,
  },
  classroomName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#455a64',
  },
  statLabel: {
    fontSize: 14,
    color: '#78909c',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#78909c',
  },
  noClassrooms: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#455a64',
    marginBottom: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#78909c',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 15,
  },
  viewButton: {
    backgroundColor: '#03a9f4',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    elevation: 1,
  },
  editButton: {
    backgroundColor: '#ff9800',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  coursesButton: {
    backgroundColor: '#9c27b0',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    elevation: 1,
  },
  // ...existing style properties...
  
  inputMethodToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },
  manualInputContainer: {
    maxHeight: 400,
  },
  studentsList: {
    maxHeight: 300,
  },
  studentInputRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  studentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginRight: 5,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ff5252',
    borderRadius: 4,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    elevation: 1,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  extractButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  previewScrollView: {
    maxHeight: '70%',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fdfdfd',
  },
  previewCell: {
    padding: 8,
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
    fontSize: 14,
  },
  previewHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f1f1f1',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginLeft: 10,
    elevation: 2,
  },
  columnMappingContainer: {
    marginBottom: 15,
  },
  mappingRow: {
    marginBottom: 10,
  },
  mappingLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  columnPicker: {
    flexDirection: 'row',
  },
  columnOption: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderRadius: 4,
    minWidth: 80,
  },
  columnOptionSelected: {
    backgroundColor: '#2196F3',
  },
  columnOptionText: {
    textAlign: 'center',
    color: '#333',
  },
  // View Modal Styles
  detailsContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#455a64',
    marginTop: 10,
  },
  detailValue: {
    fontSize: 18,
    color: '#263238',
    marginBottom: 10,
    paddingLeft: 10,
  },
  studentListHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#455a64',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  studentListScroll: {
    maxHeight: 300,
    marginTop: 5,
  },
  studentListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  studentEmail: {
    fontSize: 14,
    color: '#455a64',
    marginTop: 4,
  },
  studentRoll: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
    fontWeight: '500',
  },
  studentRemoveButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  studentRemoveButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: '#455a64',
    marginTop: 20,
    elevation: 1,
  },
  // Course Modal Styles
  courseForm: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  courseList: {
    maxHeight: 300,
  },
  courseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  courseDescription: {
    fontSize: 14,
    color: '#455a64',
    marginTop: 4,
  },
  courseSchedule: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
    fontStyle: 'italic',
  },
  heading: {
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 20
  },
});

export default CreateClassroom;
