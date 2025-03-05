import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Import CSS file
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons for password visibility

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await axios.post("http://localhost:5000/login", { email, password });
            if (res.data.success) {
                navigate("/chatbot");
            } else {
                setMessage(res.data.error);
            }
        } catch (error) {
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
