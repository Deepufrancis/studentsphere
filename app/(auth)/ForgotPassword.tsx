import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { API_BASE_URL } from "../constants";

const ForgotPassword = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your registered email.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/otp/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      Alert.alert("Success", "OTP sent to your email");
      setStep(2);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/otp/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setStep(3);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Please enter both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/otp/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      Alert.alert("Success", "Password reset successful!", [
        { text: "OK", onPress: () => navigation.navigate("index") }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderButton = (onPress: () => void, text: string) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{text}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive a verification code
          </Text>
          <TextInput
            placeholder="Email address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {renderButton(handleSendOTP, "Send Code")}
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {email}
          </Text>
          <TextInput
            placeholder="000000"
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            editable={!loading}
          />
          {renderButton(handleVerifyOTP, "Verify Code")}
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>
            Create a strong password for your account
          </Text>
          <TextInput
            placeholder="New Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />
          {renderButton(handleResetPassword, "Reset Password")}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 17,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ForgotPassword;
