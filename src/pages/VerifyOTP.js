import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5000/verify-otp', {
        email,
        otp
      });

      setMessage('OTP verified successfully! Redirecting to login...');
      setMessageType('success');

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setMessage(error.response?.data?.error || 'OTP verification failed');
      setMessageType('error');
    }
  };

  return (
    <div className="otp-container">
      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
        </div>
      )}
      <div className="otp-form">
        <h2>Verify OTP</h2>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
          />
          <button type="submit">Verify OTP</button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
