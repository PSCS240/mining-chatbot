import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPaperPlane, FaTrash } from "react-icons/fa";
import "../styles/Chatbot.css";

function Chatbot() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatAreaRef = useRef(null);

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async () => {
        if (!query.trim()) return;
        
        const newMessage = { type: "user", content: query };
        setMessages(prev => [...prev, newMessage]);
        setQuery("");
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:5000/ask", { query });
            setMessages(prev => [...prev, { type: "bot", content: res.data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { type: "bot", content: "Error: Unable to fetch response." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="App">
            <div className="chatbot-container">
                <div className="chatbot-header">
                    <h1>Mining Industry Chatbot</h1>
                </div>
                
                <div className="chat-area" ref={chatAreaRef}>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`message ${message.type === "user" ? "user-message" : "bot-message"}`}
                        >
                            {message.content}
                        </div>
                    ))}
                    {loading && (
                        <div className="message bot-message">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        className="chat-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about mining laws..."
                    />
                    <button
                        className="send-button"
                        onClick={handleSubmit}
                        disabled={loading || !query.trim()}
                    >
                        <FaPaperPlane />
                    </button>
                    <button className="clear-button" onClick={clearChat}>
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
