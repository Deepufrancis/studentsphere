import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "../constants";

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [message, setMessage] = useState('');

  // Request OTP from backend
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Email is required');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot/send-otp`, { email });
      setMessage(response.data.message);
      setStep(2); // Move to OTP verification step
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Verify OTP entered by the user
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setMessage('OTP is required');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot/verify-otp`, { email, otp });
      setMessage(response.data.message);
      setStep(3); // Move to reset password step
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  // Reset the password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !otp) {
      setMessage('OTP and new password are required');
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot/reset-password`, { 
        email, 
        otp, 
        newPassword 
      });
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Password Reset</h2>

      {step === 1 && (
        <form onSubmit={handleRequestOTP}>
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Send OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP}>
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Verify OTP
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Reset Password
          </button>
        </form>
      )}

      {message && <p style={{ color: message.includes('Failed') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
};

export default PasswordReset;
