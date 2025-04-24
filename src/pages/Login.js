import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setCompanyName }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loginSuccess, setLoginSuccess] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            });

            if (response.data.success) {
                // Store credentials in localStorage
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', response.data.company_name);

                // Show success animation
                setLoginSuccess(true);

                // Navigate after animation
                setTimeout(() => {
                    navigate('/chatbot', {
                        state: {
                            email: email,
                            userName: response.data.company_name
                        }
                    });
                }, 2000);
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "Login failed");
            setMessageType("error");
        }
    };

    return (
        <div className="auth-background">
            <div className={`auth-container ${loginSuccess ? 'page-transition' : ''}`}>
                <h2 className="auth-title">Company Login</h2>

                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Company Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />

                    <div className="password-container">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <button 
                            type="button" 
                            className="view-password-btn" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <button type="submit" className="auth-btn">
                        Login
                    </button>
                </form>

                {message && <p className={`message ${messageType}`}>{message}</p>}

                {loginSuccess && (
                    <div className="login-success">
                        <div className="success-icon"></div>
                        <div className="success-text">Login Successful!</div>
                        <div className="redirect-text">Welcome back!</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;
