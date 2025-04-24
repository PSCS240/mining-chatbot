import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/OTPVerification.css';

const OTPVerification = () => {
    const [otp, setOTP] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [timer, setTimer] = useState(60); // 1 minute in seconds
    const [canResend, setCanResend] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            navigate('/register');
        } else {
            setMessage('Registration successful! Please verify your email.');
            startTimer();
        }
    }, [email, navigate]);

    const startTimer = () => {
        setTimer(60); // Set to 60 seconds (1 minute)
        setCanResend(false);
        const interval = setInterval(() => {
            setTimer((prevTimer) => {
                if (prevTimer <= 1) {
                    clearInterval(interval);
                    setCanResend(true);
                    return 0;
                }
                return prevTimer - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleResendOTP = async () => {
        try {
            const response = await fetch('http://localhost:5000/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage('New OTP has been sent to your email!');
                startTimer();
                setError('');
            } else {
                setError(data.error || 'Failed to resend OTP');
            }
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Trim and validate OTP
        const trimmedOTP = otp.trim();
        
        if (!email) {
            setError('Email is required');
            return;
        }

        if (!trimmedOTP || !/^\d{6}$/.test(trimmedOTP)) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp: trimmedOTP }),
            });

            const data = await response.json();
            
            if (data.success) {
                setVerificationSuccess(true);
                setMessage('Verification successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.error || 'Verification failed. Please try again.');
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setError('Failed to verify OTP. Please try again.');
        }
    };

    if (!email) return null;

    return (
        <div className="otp-container">
            <div className={`otp-box ${verificationSuccess ? 'page-transition' : ''}`}>
                <h2>OTP Verification</h2>
                {message && <div className="success-message">{message}</div>}
                <p>Please enter the OTP sent to your email: {email}</p>
                <p className="timer">Time remaining: {formatTime(timer)}</p>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOTP(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="Enter OTP"
                        maxLength="6"
                        pattern="\d{6}"
                        required
                    />
                    <button type="submit">Verify OTP</button>
                    {canResend && (
                        <button type="button" onClick={handleResendOTP} className="resend-button">
                            Resend OTP
                        </button>
                    )}
                </form>
                {verificationSuccess && (
                    <div className="verification-success">
                        <div className="success-icon"></div>
                        <div className="success-text">OTP Verified Successfully!</div>
                        <div className="redirect-text">Redirecting to Login...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OTPVerification;
