import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setCompanyName }) { // ✅ Accept setCompanyName as a prop
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            console.log("Logging in with email:", email);
    
            const res = await axios.post("http://localhost:5000/login", { email, password });
            if (res.data.success) {
                console.log("Login successful, fetching user details for email:", email);
    
                // ✅ Pass email and userName to Chatbot.js
                const userRes = await axios.get(`http://localhost:5000/get-user?email=${email}`);
                console.log("Fetched user details:", userRes.data);
    
                if (userRes.data && userRes.data.user_name) {
                    navigate("/chatbot", {
                        state: {
                            userName: userRes.data.user_name,
                            email: email // ✅ Pass email as well
                        }
                    });
                } else {
                    console.error("User name not found in response");
                }
            } else {
                setMessage(res.data.error);
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("Login failed. Please try again.");
        }
    };
    
    return (
        <div className="auth-background">
            <div className="auth-container">
                <h2 className="auth-title">Company Login</h2>
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
                <button onClick={handleLogin} className="auth-btn">Login</button>
                {message && <p className="error-message">{message}</p>}
            </div>
        </div>
    );
}

export default Login;
