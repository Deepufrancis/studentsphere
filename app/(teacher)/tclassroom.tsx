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
      Alert.alert("Error", error.message);
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
    
    const processedData = sheetData.slice(1).map(row => ({
      name: columnMap.name >= 0 ? row[columnMap.name] : '',
      email: columnMap.email >= 0 ? row[columnMap.email] : '',
      rollNumber: columnMap.rollNumber >= 0 ? row[columnMap.rollNumber] : ''
    }));

    return processedData.filter(student => 
      student.name || student.email || student.rollNumber
    );
  };

  const handleCreateClassroom = async () => {
    if (!className || !section) {
      Alert.alert('Error', 'Please fill all the required fields');
      return;
    }

    try {
      const students = inputMethod === 'excel' 
        ? processSelectedColumns()
        : manualStudents.filter(s => s.name || s.email || s.rollNumber);

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
      <View style={styles.header}>
        <Text style={styles.heading}>Your Classrooms</Text>
        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.createBtnText}>+ Create Classroom</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={[styles.userInfo, styles.error]}>{error}</Text>
      ) : isLoading ? (
        <Text style={styles.userInfo}>Loading...</Text>
      ) : username ? (
        <Text style={styles.userInfo}>Welcome, {username}</Text>
      ) : null}

      {loading ? (
        <Text style={styles.loadingText}>Loading classrooms...</Text>
      ) : classrooms.length > 0 ? (
        <ScrollView style={styles.classroomList}>
          {classrooms.map((classroom) => (
            <View key={classroom._id} style={styles.classroomCard}>
              <View style={styles.classroomHeader}>
                <View>
                  <Text style={styles.classroomName}>{classroom.className}</Text>
                  <Text style={styles.classroomSection}>Section: {classroom.section}</Text>
                </View>
                <View style={styles.cardButtons}>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewClassroom(classroom)}
                  >
                    <Text style={styles.buttonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditClassroom(classroom)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.studentCount}>
                {classroom.students.length} Students
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noClassrooms}>No classrooms created yet</Text>
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
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                        <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
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
  container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
  fileName: { marginTop: 10, fontStyle: "italic", textAlign: "center" },
  scrollView: { marginTop: 20 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee" },
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
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  },
  createButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginLeft: 10,
  },
  classroomList: {
    flex: 1,
    marginTop: 10,
  },
  classroomCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  classroomSection: {
    fontSize: 16,
    color: '#6c757d',
  },
  studentCount: {
    fontSize: 14,
    color: '#495057',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 20,
  },
  noClassrooms: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
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
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleButtonText: {
    textAlign: 'center',
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
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
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
  },
  previewRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
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
  cardButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  detailValue: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  studentListHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  studentListScroll: {
    maxHeight: '50%',
  },
  studentListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  studentEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  studentRoll: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#666',
    marginTop: 20,
  },
  courseForm: {
    marginBottom: 20,
  },
  courseList: {
    maxHeight: '50%',
  },
  courseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  courseSchedule: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default CreateClassroom;
