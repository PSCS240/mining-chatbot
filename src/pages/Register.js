import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

const Register = ({ setUserEmail }) => {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    isStrong: false
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");

  const countryCodes = [
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+7', country: 'Russia' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+34', country: 'Spain' },
    { code: '+82', country: 'South Korea' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+48', country: 'Poland' },
    { code: '+43', country: 'Austria' },
    { code: '+41', country: 'Switzerland' },
    { code: '+32', country: 'Belgium' },
    { code: '+351', country: 'Portugal' },
    { code: '+30', country: 'Greece' },
    { code: '+353', country: 'Ireland' },
    { code: '+90', country: 'Turkey' },
    { code: '+972', country: 'Israel' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+65', country: 'Singapore' },
    { code: '+60', country: 'Malaysia' },
    { code: '+63', country: 'Philippines' },
    { code: '+62', country: 'Indonesia' },
    { code: '+84', country: 'Vietnam' },
    { code: '+64', country: 'New Zealand' },
    { code: '+27', country: 'South Africa' },
    { code: '+20', country: 'Egypt' },
    { code: '+234', country: 'Nigeria' },
    { code: '+254', country: 'Kenya' },
    { code: '+380', country: 'Ukraine' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+36', country: 'Hungary' },
    { code: '+40', country: 'Romania' },
    { code: '+359', country: 'Bulgaria' }
  ];

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = "";

    // Length check
    if (password.length >= 8) score++;
    
    // Contains number
    if (/\d/.test(password)) score++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;
    
    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        message = "Very weak";
        break;
      case 2:
        message = "Weak";
        break;
      case 3:
        message = "Medium";
        break;
      case 4:
        message = "Strong";
        break;
      case 5:
        message = "Very strong";
        break;
      default:
        message = "";
    }

    setPasswordStrength({
      score,
      message,
      isStrong: score >= 4
    });
  };

  const validateFields = () => {
    if (companyName.length < 2) {
      setMessage("Company name must be at least 2 characters long");
      setMessageType("error");
      return false;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      return false;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      setMessage("Please enter a valid phone number");
      setMessageType("error");
      return false;
    }

    if (address.length < 10) {
      setMessage("Please enter a complete address");
      setMessageType("error");
      return false;
    }

    if (!passwordStrength.isStrong) {
      setMessage("Please choose a stronger password");
      setMessageType("error");
      return false;
    }

    return true;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000); // Message will disappear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
  
    if (!validateFields()) {
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }
  
    try {
      const { data } = await axios.post("http://localhost:5000/register", {
        company_name: companyName,
        email,
        phone_number: phoneNumber,
        address,
        password,
      });
  
      // Use the server's response message if available, otherwise use default
      setMessage(data.message || "Registration successful! Redirecting to OTP verification...");
      setMessageType("success");
      
      // Store email for OTP verification
      setUserEmail(email);
      
      // Redirect after showing message
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 2000);
      
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed");
      setMessageType("error");
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-form">
        <h2>Company Registration</h2>
        <form id="registration-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your company email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className="phone-input-container">
              <select 
                className="country-code-select"
                value={selectedCountryCode}
                onChange={(e) => setSelectedCountryCode(e.target.value)}
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.code} {country.country}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className="phone-input"
                placeholder="Enter phone number"
                pattern="[0-9]{10}"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Company Address</label>
            <textarea
              id="address"
              name="address"
              placeholder="Enter your company address"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <button type="button" onClick={togglePasswordVisibility} className="eye-button">
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
            {password && (
              <div className={`password-strength ${passwordStrength.score >= 4 ? 'strong' : 'weak'}`}>
                Strength: {passwordStrength.message}
                <div className="strength-meter">
                  {[...Array(5)].map((_, index) => (
                    <div 
                      key={index} 
                      className={`strength-bar ${index < passwordStrength.score ? 'filled' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-group password-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={toggleConfirmPasswordVisibility} className="eye-button">
                {showConfirmPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>
          <button type="submit" className="register-button">Register</button>
        </form>
      </div>
      {message && (
        <div className={`bottom-message-banner ${messageType}`} role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default Register;
