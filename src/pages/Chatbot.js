import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
    FaPaperPlane,
    FaTrash,
    FaMicrophone,
    FaStop,
    FaVolumeMute,
    FaVolumeUp,
    FaUserCircle,
    FaQuestion,
    FaClock,
    FaPlus,
    FaHistory,
    FaRobot,
    FaUser
} from "react-icons/fa";
import "../styles/Chatbot.css";

function Chatbot() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [stats, setStats] = useState({
        questionsAsked: 0,
        sessionStart: new Date(),
        lastActive: new Date(),
        expertise: ['Mining Laws', 'Safety Regulations', 'Environmental Compliance']
    });
    const chatAreaRef = useRef(null);
    const recognitionRef = useRef(null);
    const location = useLocation();
    const email = location.state?.email || "";
    const [userName, setUserName] = useState(location.state?.userName || "Guest");

    // Fetch User Name from Database
    useEffect(() => {
        if (!email) return; // Avoid fetching if no email is present

        const fetchUserName = async () => {
            try {
                console.log("Fetching user for email:", email);
                const res = await axios.get(`http://localhost:5000/get-user?email=${email}`);
                if (res.data && res.data.user_name) {
                    console.log("User fetched:", res.data.user_name);
                    setUserName(res.data.user_name);
                }
            } catch (error) {
                console.error("Failed to fetch user name:", error);
            }
        };

        fetchUserName();
    }, [email]);

    // Initial Bot Greeting
    useEffect(() => {
        setMessages([{ type: "bot", content: "Hello! How can I assist you with Mining Laws?" }]);
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // Update stats when new message is sent
    useEffect(() => {
        if (messages.filter(m => m.type === "user").length > 0) {
            setStats(prev => ({
                ...prev,
                questionsAsked: messages.filter(m => m.type === "user").length,
                lastActive: new Date()
            }));
        }
    }, [messages]);

    // Calculate time spent
    const getTimeSpent = () => {
        const now = new Date();
        const diff = now - stats.sessionStart;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just started';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    // Format last active time
    const getLastActiveTime = () => {
        const now = new Date();
        const diff = now - stats.lastActive;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return stats.lastActive.toLocaleDateString();
    };

    // Handle Sending Query
    const handleSubmit = async (input = null) => {
        const finalQuery = input || query;
        if (!finalQuery.trim()) return;
    
        setMessages((prev) => [...prev, { type: "user", content: finalQuery }]);
        setQuery("");
        setLoading(true);
    
        try {
            const res = await axios.post("http://localhost:5000/ask", { question: finalQuery });
    
            if (!res.data || !res.data.response) throw new Error("No response from API");
    
            // Split the response by newlines and display each line separately
            const formattedResponse = res.data.response.split("\n").map(line => line.trim()).filter(line => line !== "");
    
            formattedResponse.forEach((line) => {
                setMessages((prev) => [...prev, { type: "bot", content: line }]);
            });
    
            setHistory((prev) => [...prev, finalQuery]);
    
            if (!isMuted) speakResponse(res.data.response);
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages((prev) => [...prev, { type: "bot", content: "Error: Unable to fetch response." }]);
        } finally {
            setLoading(false);
        }
    };
    

    // Start New Chat
    const startNewChat = () => {
        setMessages([{ type: "bot", content: "Hello! How can I assist you with Mining Laws?" }]);
        setHistory([]);
    };

    // Start Voice Recognition
    const startVoiceRecognition = () => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            setMessages((prev) => [...prev, { type: "bot", content: "Speech recognition not supported." }]);
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognitionRef.current = recognition;
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        setIsRecording(true);

        recognition.onresult = (event) => {
            const userSpeech = event.results[0][0].transcript.trim();
            if (userSpeech) handleSubmit(userSpeech);
        };

        recognition.onerror = (event) => {
            console.error("Voice recognition error:", event.error);
            setIsRecording(false);
        };

        recognition.onend = () => setIsRecording(false);

        recognition.start();
    };

    // Stop Voice Recognition
    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    // Text-to-Speech
    const speakResponse = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(speech);
    };

    // Toggle Mute
    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (!isMuted) window.speechSynthesis.cancel();
    };

    // Clear Chat
    const clearChat = () => {
        setMessages([]);
    };

    // Theme toggle function
    const toggleTheme = (selectedTheme) => {
        setTheme(selectedTheme);
        document.documentElement.setAttribute('data-theme', selectedTheme);
    };

    // Set initial theme and system preference
    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
    }, []);

    return (
        <div className="chatbot-wrapper">
            {/* Left Side - History */}
            <div className="history-panel">
                <h2>Chat History</h2>
                <div class="history-buttons">
                    <button class="new-chat-button">New Conversation</button>
                    <button class="delete-chat-button">Delete Chat</button>
                </div>

                {history.length === 0 ? (
                    <p>No conversation history</p>
                ) : (
                    <ul>
                        {history.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Center - Chatbot */}
            <div className="chatbot-container">
                <div className="chatbot-header">
                    <h1>Mining Industry Chatbot</h1>
                    <div className="header-controls">
                        {/* <select 
                            className="theme-selector" 
                            value={theme} 
                            onChange={(e) => toggleTheme(e.target.value)}
                        >
                            <option value="dark">Dark Theme</option>
                            <option value="light">Light Theme</option>
                        </select> */}
                        <button className="mute-button" onClick={toggleMute}>
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>
                    </div>
                </div>

                <div className="chat-area" ref={chatAreaRef}>
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.type}-message`}>
                            {message.content}
                        </div>
                    ))}
                    {isRecording && (
                        <div className="message bot-message">
                            Recording... <button onClick={stopVoiceRecognition}><FaStop /></button>
                        </div>
                    )}
                </div>

                <div className="input-area">
                    <div className="input-container">
                        <input
                            type="text"
                            className="chat-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about mining laws..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <div className="button-group">
                            <button className="voice-button" onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}>
                                {isRecording ? <FaStop /> : <FaMicrophone />}
                            </button>
                            <button className="send-button" onClick={() => handleSubmit()}>
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Profile */}
            <div className="profile-section">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaRobot />
                    </div>
                    <h3>Welcome, {userName}!</h3>
                    <div className="user-role">
                        Mining Law Assistant
                    </div>
                </div>
                <div className="profile-content">
                    <div className="profile-stats">
                        <div className="questions-asked">
                            <div className="stat-icon">
                                <FaQuestion />
                            </div>
                            <div className="stat-info">
                                <h4>Questions Asked</h4>
                                <p>{stats.questionsAsked}</p>
                            </div>
                        </div>
                        <div className="time-spent">
                            <div className="stat-icon">
                                <FaClock />
                            </div>
                            <div className="stat-info">
                                <h4>Time Spent</h4>
                                <p>{getTimeSpent()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="session-info">
                        <div className="info-item">
                            <div className="info-icon">
                                <FaClock />
                            </div>
                            <div className="info-text">
                                <h4>Last Activity</h4>
                                <p>{getLastActiveTime()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="expertise-section">
                    <h4>Areas of Expertise</h4>
                    <div className="expertise-tags">
                        {stats.expertise.map((item, index) => (
                            <span key={index} className="expertise-tag">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
