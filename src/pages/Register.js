import React, { useState } from "react";
import axios from "axios";
import "../styles/Register.css";

const Register = () => {
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/register", {
        company_name: companyName,
        email,
        phone_number: phoneNumber,
        address,
        password,
      });

      setMessage(response.data.message);
      setMessageType("success");

      // Clear form fields after successful registration
      setCompanyName("");
      setEmail("");
      setPhoneNumber("");
      setAddress("");
      setPassword("");
      setConfirmPassword("");
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
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Enter your company number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={togglePasswordVisibility} className="eye-button">
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
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
        {message && (
          <p className={`message ${messageType}`}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default Register;
