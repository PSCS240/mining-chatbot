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
        setMessages([{ type: "bot", text: "Hello! How can I assist you with Mining Laws?", timestamp: new Date() }]);
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

    const formatBotResponse = (text) => {
        if (!text) return text;
    
        // Split the text into sections using '**' for bold
        const sections = text.split(/\*\*(.*?)\*\*/).filter(Boolean);
    
        return sections.map((section, index) => {
            if (index % 2 === 0) {
                // Format normal text (no bold)
                return (
                    <div key={index}>
                        {section.split('\n').map((line, i) => {
                            if (line.match(/^\d+\./)) {
                                // Numbered list
                                return <p key={i} style={{ marginLeft: "20px" }}>{line}</p>;
                            } else if (line.match(/^-/)) {
                                // Bullet point list
                                return <p key={i} style={{ marginLeft: "20px" }}>• {line.substring(1).trim()}</p>;
                            } else {
                                // Normal text
                                return <p key={i}>{line}</p>;
                            }
                        })}
                    </div>
                );
            } else {
                // Format bold text
                return (
                    <strong key={index}>
                        {section}
                    </strong>
                );
            }
        });
    };

    const extractTextFromJSX = (jsx) => {
        if (typeof jsx === 'string') return jsx;
        if (Array.isArray(jsx)) return jsx.map(extractTextFromJSX).join(' ');
        if (jsx && typeof jsx === 'object' && jsx.props) {
            return extractTextFromJSX(jsx.props.children);
        }
        return '';
    };
    
    const handleSubmit = async (e, customQuery = null) => {
        if (e) e.preventDefault();
    
        const finalQuery = customQuery || query;
        if (!finalQuery.trim()) return;
    
        setMessages(prev => [...prev, { type: "user", text: finalQuery, timestamp: new Date() }]);
        setQuery("");
        setLoading(true);
    
        try {
            const res = await axios.post("http://localhost:5000/ask", { question: finalQuery });
            if (!res.data || !res.data.response) throw new Error("No response from API");
    
            const formattedResponse = formatBotResponse(res.data.response);
            
            setMessages(prev => [...prev, { 
                type: "bot", 
                text: formattedResponse, 
                timestamp: new Date() 
            }]);
    
            setHistory(prev => [...prev, { 
                query: finalQuery, 
                timestamp: new Date() 
            }]);
    
            // ✅ Extract plain text from JSX for speech synthesis
            if (!isMuted) speakResponse(extractTextFromJSX(formattedResponse));
    
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages(prev => [...prev, { 
                type: "bot", 
                text: "Sorry, I encountered an error. Please try again.", 
                timestamp: new Date() 
            }]);
        } finally {
            setLoading(false);
        }
    };
    

    // Start New Chat
    const startNewChat = () => {
        setMessages([{ type: "bot", text: "Hello! How can I assist you with Mining Laws?", timestamp: new Date() }]);
        setHistory([]);
    };

// Start Voice Recognition
const startVoiceRecognition = () => {
    const SpeechRecognition = 
        window.SpeechRecognition || 
        window.webkitSpeechRecognition || 
        null;

    if (!SpeechRecognition) {
        setMessages(prev => [...prev, { 
            type: "bot", 
            text: "Speech recognition is not supported in your browser.", 
            timestamp: new Date() 
        }]);
        return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsRecording(true);

    recognition.onresult = (event) => {
        const userSpeech = event.results[0][0].transcript.trim();
        if (userSpeech) {
            setQuery(userSpeech);
            handleSubmit({ preventDefault: () => {} }); // ✅ Trigger submission
        }
    };

    recognition.onerror = (event) => {
        console.error("Voice recognition error:", event.error);

        if (event.error === 'not-allowed') {
            setMessages(prev => [...prev, { 
                type: "bot", 
                text: "Microphone access denied. Please enable microphone permissions.", 
                timestamp: new Date() 
            }]);
        } else if (event.error === 'no-speech') {
            setMessages(prev => [...prev, { 
                type: "bot", 
                text: "No speech detected. Try speaking more clearly.", 
                timestamp: new Date() 
            }]);
        } else {
            setMessages(prev => [...prev, { 
                type: "bot", 
                text: `Voice recognition error: ${event.error}`, 
                timestamp: new Date() 
            }]);
        }

        setIsRecording(false);
    };

    recognition.onend = () => {
        setIsRecording(false);
    };

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
    const toggleMute = () => {
        console.log("Mute button clicked"); // ✅ Test logging
        if (!isMuted) {
            window.speechSynthesis.cancel(); 
        }
        setIsMuted(!isMuted);
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
        <div className={`chatbot-container ${theme}-theme`}>
            {/* Left Sidebar */}
            <div className="sidebar sidebar-left">
                <div className="sidebar-buttons">
                    <button className="new-chat-button" onClick={startNewChat}>
                        <FaPlus /> New Chat
                    </button>
                    <button className="delete-chat-button" onClick={clearChat}>
                        <FaTrash /> Clear Chat
                    </button>
                </div>
                <div className="chat-history">
                    {history.map((item, index) => (
                        <div key={index} className="chat-history-item">
                            <div className="chat-history-content">
                                <FaHistory className="history-icon" />
                                <span>{item.query}</span>
                                <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="main-content">
                <div className="chat-header">
                    <h2>Mining Law Assistant</h2>
                    <select 
                        value={theme} 
                        onChange={(e) => toggleTheme(e.target.value)}
                        className="theme-selector"
                    >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                    </select>
                </div>

                <div className="chat-area" ref={chatAreaRef}>
                    {messages.map((message, index) => (
                        <div key={index} className={`message ${message.type}`}>
                            <div className="message-icon">
                                {message.type === 'user' ? <FaUser /> : <FaRobot />}
                            </div>
                            <div className="message-content">
                                <p>{message.text}</p>
                                <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="loading">Processing...</div>}
                </div>

                <div className="input-area">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question about mining laws..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="button-group">
                        <button 
                            className={`mic-button ${isRecording ? 'recording' : ''}`}
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                        >
                            {isRecording ? <FaStop /> : <FaMicrophone />}
                        </button>
                        <button 
                            className="mute-button"
                            onClick={toggleMute}>
                            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                        </button>


                        <button 
                            className="send-button" 
                            onClick={(e) => handleSubmit(e)}
                            disabled={!query.trim() && !isRecording}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Profile Info */}
            <div className="sidebar sidebar-right">
                <div className="profile-section">
                    <FaUserCircle className="profile-icon" />
                    <h3>{userName}</h3>
                    <p>{email}</p>
                </div>
                <div className="stats-section">
                    <div className="stat-item">
                        <FaQuestion />
                        <span>Questions Asked: {stats.questionsAsked}</span>
                    </div>
                    <div className="stat-item">
                    <FaClock />
                        <span>Time Spent: {getTimeSpent()}</span>
                    </div>
                    <div className="stat-item">
                        <FaClock />
                        <span>Last Active: {getLastActiveTime()}</span>
                    </div>
                </div>
                <div className="expertise-section">
                    <h4>AI Assistant Expertise</h4>
                    <ul>
                        {stats.expertise.map((exp, index) => (
                            <li key={index}>{exp}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
