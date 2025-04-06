import React, { useState } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from "../constants";
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';

export default function SignUp() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'teacher' | 'student' | ''>('');
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const checkmarkAnimation = React.useRef(new Animated.Value(0)).current;

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text.length > 0) {
      setIsEmailValid(validateEmail(text));
    } else {
      setIsEmailValid(null);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasSpecialChar;
  };

  const handlePasswordChange = (text: string) => {
    setSignUpPassword(text);
    if (text.length > 0) {
      setIsPasswordValid(validatePassword(text));
    } else {
      setIsPasswordValid(null);
    }
  };

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }
    
    try {
      setIsCheckingUsername(true);
      const response = await fetch(`${API_BASE_URL}/check-username?username=${username}`);
      const data = await response.json();
      setIsUsernameAvailable(!data.exists);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      setIsSignUpLoading(true);

      // Validate form fields
      if (!signUpUsername || !signUpPassword || !confirmPassword || !signUpRole || !email) {
        setError('Please fill all fields');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }
      if (!validatePassword(signUpPassword)) {
        setError('Password must be at least 8 characters long,contain at least one special chara');
        return;
      }
      if (signUpPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!isUsernameAvailable) {
        setError('Please choose a different username');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: signUpUsername, 
          password: signUpPassword, 
          role: signUpRole,
          email: email 
        }),
      });

      console.log('Signup response status:', response.status);
      const data = await response.json();
      console.log('Signup response data:', data);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.message || 'Username or email already exists');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Invalid input data');
        } else if (response.status === 500) {
          console.error('Server error details:', data);
          throw new Error('Server error: Please try again later');
        } else {
          throw new Error(data.message || `Server error (${response.status})`);
        }
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        // Reset form
        setSignUpUsername('');
        setSignUpPassword('');
        setConfirmPassword('');
        setSignUpRole('');
        setEmail('');
        setError(null);
      }, 2000);

    } catch (err: any) {
      console.error('Sign-up error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSignUpLoading(false);
    }
  };

  const SuccessModal = () => {
    React.useEffect(() => {
      Animated.sequence([
        Animated.timing(checkmarkAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }, []);

    return (
      <Modal
        transparent
        visible={showSuccessModal}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.checkmarkContainer}>
              <Animated.View style={[
                styles.checkmark,
                {
                  opacity: checkmarkAnimation,
                  transform: [{
                    scale: checkmarkAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1]
                    })
                  }]
                }
              ]}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </Animated.View>
            </View>
            <Text style={styles.modalText}>Account Created Successfully!</Text>
          </View>
        </View>
      </Modal>
    );
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#007bff" />;
  }

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <View style={styles.topSection}>
                <Text style={styles.title}>Create Account</Text>
              </View>

              <View style={styles.bottomSection}>
                <View style={styles.inputWrapper}>
                  {isEmailValid !== null && (
                    <Text style={[
                      styles.floatingValidation, 
                      { color: isEmailValid ? '#4CAF50' : '#FF5252' }
                    ]}>
                      {isEmailValid ? 'Valid email address' : 'Invalid email address'}
                    </Text>
                  )}
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Email" 
                      value={email} 
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  {!isCheckingUsername && isUsernameAvailable !== null && (
                    <Text style={[
                      styles.floatingValidation,
                      { color: isUsernameAvailable ? '#4CAF50' : '#FF5252' }
                    ]}>
                      {isUsernameAvailable ? 'Username is available' : 'Username is already taken'}
                    </Text>
                  )}
                  <View style={styles.inputContainer}>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Username" 
                      value={signUpUsername} 
                      onChangeText={(text) => {
                        setSignUpUsername(text);
                        checkUsername(text);
                      }}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  {isPasswordValid !== null && (
                    <Text style={[
                      styles.floatingValidation,
                      { color: isPasswordValid ? '#4CAF50' : '#FF5252' }
                    ]}>
                      {isPasswordValid ? 
                        'Password meets requirements' : 
                        'Password must be at least 8 characters with one special character'
                      }
                    </Text>
                  )}
                  <View style={styles.inputContainer}>
                    <View style={styles.passwordInnerContainer}>
                      <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Password" 
                        secureTextEntry={!showSignUpPassword} 
                        value={signUpPassword} 
                        onChangeText={handlePasswordChange} 
                      />
                      <TouchableOpacity onPress={() => setShowSignUpPassword(!showSignUpPassword)} style={styles.eyeButton}>
                        <Ionicons name={showSignUpPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  {confirmPassword && signUpPassword !== confirmPassword && (
                    <Text style={[
                      styles.floatingValidation,
                      { color: '#FF5252' }
                    ]}>
                      Passwords do not match
                    </Text>
                  )}
                  <View style={styles.inputContainer}>
                    <View style={styles.passwordInnerContainer}>
                      <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Confirm Password" 
                        secureTextEntry={!showConfirmPassword} 
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                        <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.segmentedWrapper}>
                  <View style={styles.segmentedControl}>
                    <Animated.View style={[
                      styles.segmentSlider,
                      {
                        transform: [{
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 136] // Adjusted to exact segment width
                          })
                        }]
                      }
                    ]} />
                    <TouchableOpacity 
                      onPress={() => {
                        setSignUpRole('teacher');
                        Animated.spring(slideAnim, {
                          toValue: 0,
                          useNativeDriver: true,
                          friction: 12,
                          tension: 100
                        }).start();
                      }} 
                      style={[
                        styles.segment,
                        signUpRole === 'teacher' && styles.activeSegment
                      ]}
                    >
                      <Ionicons 
                        name="school" 
                        size={20} 
                        color={signUpRole === 'teacher' ? "#fff" : "#666"} 
                        style={styles.segmentIcon}
                      />
                      <Text style={[
                        styles.segmentText,
                        signUpRole === 'teacher' && styles.segmentTextSelected
                      ]}>Teacher</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => {
                        setSignUpRole('student');
                        Animated.spring(slideAnim, {
                          toValue: 1,
                          useNativeDriver: true,
                          friction: 12,
                          tension: 100
                        }).start();
                      }} 
                      style={[
                        styles.segment,
                        signUpRole === 'student' && styles.activeSegment
                      ]}
                    >
                      <Ionicons 
                        name="person" 
                        size={20} 
                        color={signUpRole === 'student' ? "#fff" : "#666"} 
                        style={styles.segmentIcon}
                      />
                      <Text style={[
                        styles.segmentText,
                        signUpRole === 'student' && styles.segmentTextSelected
                      ]}>Student</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
                {isSignUpLoading ? (
                  <ActivityIndicator size="large" color="#007bff" />
                ) : (
                  <TouchableOpacity style={styles.loginButtonContainer} onPress={handleSignUp}>
                    <LinearGradient 
                      colors={["#1a237e", "#534bae"]} 
                      style={styles.loginButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.loginButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={24} color="#fff" style={styles.buttonIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <SuccessModal />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  titleContainer: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 40, // Reduced from 160
    marginLeft: 10,
  },
  title: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: "Poppins_700Bold",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 8,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 24, // Reduced from 36
    position: 'relative',
  },
  floatingValidation: {
    position: 'absolute',
    top: -20, // Changed from bottom: -24 back to top positioning
    left: 12,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    zIndex: 1,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    width: "85%",
    padding: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  validationText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  passwordInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1a237e',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  segmentedWrapper: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
    padding: 4,
  },

  segmentedControl: {
    width: 280, // Fixed width instead of percentage
    height: 48,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    padding: 2,
  },

  segmentSlider: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 136, // (280 - 4) / 2 to account for padding
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 6,
  },

  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderRadius: 22,
  },

  activeSegment: {
    backgroundColor: 'transparent',
  },

  segmentIcon: {
    marginRight: 8,
  },

  segmentText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
  },

  segmentTextSelected: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loginButtonContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loginButton: {
    width: '100%',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmarkContainer: {
    marginBottom: 16,
  },
  checkmark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  topSection: {
    paddingTop: 70,
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    gap: 16,
    marginBottom: 40,
  },
  buttonWrapper: {
    width: "85%",
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});