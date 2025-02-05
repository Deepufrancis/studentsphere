import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'teacher' | 'student' | ''>(''); // Explicit role type
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false); // State to toggle modal visibility
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'teacher' | 'student' | ''>(''); // Role for sign-up
  const router = useRouter();

  const handleLogin = async () => {
    if (role && username && password) {
      setIsLoading(true);

      try {
        const response = await fetch('http://10.58.0.213:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, role }),
        });

        const data = await response.json();

        if (response.status === 200) {
          router.push(`/${role}`);
        } else {
          Alert.alert('Error', data.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong!');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Error', 'Please fill all fields and select a role.');
    }
  };

  const handleSignUp = async () => {
    if (signUpUsername && signUpPassword && signUpRole) {
      try {
        const response = await fetch('http://10.58.0.213:5000/api/signUp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: signUpUsername, password: signUpPassword, role: signUpRole }),
        });

        const data = await response.json();

        if (response.status === 201) {
          Alert.alert('Success', 'User created successfully!');
          setModalVisible(false); // Close modal after successful sign-up
        } else {
          Alert.alert('Error', data.message);
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong!');
      }
    } else {
      Alert.alert('Error', 'Please fill all fields.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PU Student Sphere</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.roleButtons}>
        <TouchableOpacity onPress={() => setRole('teacher')} style={[styles.button, role === 'teacher' && styles.selected]}>
          <Text style={styles.buttonText}>Teacher</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRole('student')} style={[styles.button, role === 'student' && styles.selected]}>
          <Text style={styles.buttonText}>Student</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signUpButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal for Sign Up */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign Up</Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              value={signUpUsername}
              onChangeText={setSignUpUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={signUpPassword}
              onChangeText={setSignUpPassword}
            />

            <View style={styles.roleButtons}>
              <TouchableOpacity onPress={() => setSignUpRole('teacher')} style={[styles.button, signUpRole === 'teacher' && styles.selected]}>
                <Text style={styles.buttonText}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSignUpRole('student')} style={[styles.button, signUpRole === 'student' && styles.selected]}>
                <Text style={styles.buttonText}>Student</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
              <Text style={styles.loginButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    width: '48%',
    padding: 10,
    backgroundColor: '#007bff',
    alignItems: 'center',
    borderRadius: 5,
  },
  selected: {
    backgroundColor: '#0056b3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#28a745',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  signUpButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ffc107',
    alignItems: 'center',
    borderRadius: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
});


