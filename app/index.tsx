import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.10.33.76:5000/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'teacher' | 'student' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password || !role) {
      return Alert.alert('Error', 'Please fill all fields and select a role.');
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();
      if (response.status===200) {
        await AsyncStorage.setItem('loggedInUser',username);
        await AsyncStorage.setItem('userRole',role);
        router.push(`/${role}`);
      } else {
        Alert.alert('Error', data.message || 'Login failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpUsername || !signUpPassword || !signUpRole) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    setIsSignUpLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signUpUsername, password: signUpPassword, role: signUpRole }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'User created successfully!');
        setSignUpUsername('');
        setSignUpPassword('');
        setSignUpRole('');
        setModalVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Sign-up failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsSignUpLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PU Student Sphere</Text>
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <View style={styles.roleButtons}>
        <TouchableOpacity onPress={() => setRole('teacher')} style={[styles.button, role === 'teacher' && styles.selected]}>
          <Text style={styles.buttonText}>Teacher</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('student')} style={[styles.button, role === 'student' && styles.selected]}>
          <Text style={styles.buttonText}>Student</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#007bff" /> : <TouchableOpacity style={styles.loginButton} onPress={handleLogin}><Text style={styles.loginButtonText}>Login</Text></TouchableOpacity>}
      <TouchableOpacity style={styles.signUpButton} onPress={() => setModalVisible(true)}><Text style={styles.buttonText}>Sign Up</Text></TouchableOpacity>
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign Up</Text>
            <TextInput style={styles.input} placeholder="Username" value={signUpUsername} onChangeText={setSignUpUsername} />
            <View style={styles.passwordContainer}>
              <TextInput style={styles.passwordInput} placeholder="Password" secureTextEntry={!showSignUpPassword} value={signUpPassword} onChangeText={setSignUpPassword} />
              <TouchableOpacity onPress={() => setShowSignUpPassword(!showSignUpPassword)} style={styles.eyeButton}>
                <Ionicons name={showSignUpPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <View style={styles.roleButtons}>
              <TouchableOpacity onPress={() => setSignUpRole('teacher')} style={[styles.button, signUpRole === 'teacher' && styles.selected]}>
                <Text style={styles.buttonText}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSignUpRole('student')} style={[styles.button, signUpRole === 'student' && styles.selected]}>
                <Text style={styles.buttonText}>Student</Text>
              </TouchableOpacity>
            </View>
            {isSignUpLoading ? <ActivityIndicator size="large" color="#007bff" /> : <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}><Text style={styles.loginButtonText}>Sign Up</Text></TouchableOpacity>}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}><Text style={styles.buttonText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 30, 
    color: '#f8f9fa', 
    fontWeight: 'bold', 
    marginBottom: 40 
  },
  input: { 
    width: '100%', 
    padding: 14, 
    backgroundColor: '#2d2d3a', 
    borderRadius: 10, 
    marginBottom: 15, 
    color: '#fff', 
    fontSize: 16 
  },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    backgroundColor: '#2d2d3a', 
    borderRadius: 10, 
    marginBottom: 15, 
    paddingHorizontal: 10 
  },
  passwordInput: { 
    flex: 1, 
    padding: 14, 
    color: '#fff', 
    fontSize: 16 
  },
  eyeButton: { 
    padding: 12 
  },
  roleButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginBottom: 25 
  },
  button: { 
    width: '48%', 
    padding: 12, 
    backgroundColor: '#007bff', 
    alignItems: 'center', 
    borderRadius: 10 
  },
  selected: { 
    backgroundColor: '#04a61b' 
  },
  buttonText: { 
    color: '#f8f9fa', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  loginButton: { 
    width: '100%', 
    padding: 16, 
    backgroundColor: '#28a745', 
    alignItems: 'center', 
    borderRadius: 10, 
    marginBottom: 15 
  },
  loginButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  signUpButton: { 
    width: '100%', 
    padding: 16, 
    backgroundColor: '#ffc107', 
    alignItems: 'center', 
    borderRadius: 10 
  },
  closeButton: { 
    marginTop: 15, 
    padding: 12, 
    backgroundColor: '#dc3545', 
    alignItems: 'center', 
    borderRadius: 10 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.6)' 
  },
  modalContainer: { 
    width: '85%', 
    padding: 25, 
    backgroundColor: '#2d2d3a', 
    borderRadius: 12 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center', 
    color: '#f8f9fa' 
  },
});

