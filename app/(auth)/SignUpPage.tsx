import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from "../constants";
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp() {
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'teacher' | 'student' | ''>('');
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!signUpUsername || !signUpPassword || !confirmPassword || !signUpRole) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    if (signUpPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
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
        setConfirmPassword('');
        setSignUpRole('');
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
    <LinearGradient colors={["rgb(139, 132, 132)", "#FFFFFF"]} style={styles.container}>
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput style={styles.input} placeholder="Username" value={signUpUsername} onChangeText={setSignUpUsername} />
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password" secureTextEntry={!showSignUpPassword} value={signUpPassword} onChangeText={setSignUpPassword} />
        <TouchableOpacity onPress={() => setShowSignUpPassword(!showSignUpPassword)} style={styles.eyeButton}>
          <Ionicons name={showSignUpPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
          <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
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
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 30, color: '#1E1E1E', fontWeight: 'bold', marginBottom: 40, textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { width: '100%', padding: 14, backgroundColor: '#EAEAEA', borderRadius: 12, marginBottom: 15, color: '#1E1E1E', fontSize: 16, borderWidth: 1, borderColor: '#D1D1D1' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#EAEAEA', borderRadius: 12, marginBottom: 15, paddingHorizontal: 10, borderWidth: 1, borderColor: '#D1D1D1' },
  passwordInput: { flex: 1, padding: 14, color: '#1E1E1E', fontSize: 16 },
  eyeButton: { padding: 12 },
  roleButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  button: { width: '48%', padding: 14, backgroundColor: '#000', alignItems: 'center', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 },
  selected: { backgroundColor: '#008060' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  loginButton: { width: '100%', padding: 16, backgroundColor: '#008060', alignItems: 'center', borderRadius: 12, marginBottom: 15, shadowColor: '#008060', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' }
});