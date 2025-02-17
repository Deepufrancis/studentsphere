import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "./constants";

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
        router.replace(`/${role}`);
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
    backgroundColor: '#FAFAFA', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    fontSize: 30, 
    color: '#1E1E1E', 
    fontWeight: 'bold', 
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  input: { 
    width: '100%', 
    padding: 14, 
    backgroundColor: '#EAEAEA', 
    borderRadius: 12, 
    marginBottom: 15, 
    color: '#1E1E1E', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D1D1'
  },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    backgroundColor: '#EAEAEA', 
    borderRadius: 12, 
    marginBottom: 15, 
    paddingHorizontal: 10, 
    borderWidth: 1,
    borderColor: '#D1D1D1'
  },
  passwordInput: { 
    flex: 1, 
    padding: 14, 
    color: '#1E1E1E', 
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
    padding: 14, 
    backgroundColor: '#000', 
    alignItems: 'center', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5
  },
  selected: { 
    backgroundColor: '#008060' 
  },
  buttonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  loginButton: { 
    width: '100%', 
    padding: 16, 
    backgroundColor: '#008060', 
    alignItems: 'center', 
    borderRadius: 12, 
    marginBottom: 15,
    shadowColor: '#008060',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  loginButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  signUpButton: { 
    width: '100%', 
    padding: 16, 
    backgroundColor: '#FFCC00', 
    alignItems: 'center', 
    borderRadius: 12,
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  closeButton: { 
    marginTop: 15, 
    padding: 14, 
    backgroundColor: '#D32F2F', 
    alignItems: 'center', 
    borderRadius: 12,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContainer: { 
    width: '85%', 
    padding: 25, 
    backgroundColor: '#fff', 
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center', 
    color: '#1E1E1E' 
  },
});


