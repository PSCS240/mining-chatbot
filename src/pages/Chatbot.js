import React, { useState } from "react";
import axios from "axios";
import "../styles/Chatbot.css";

function Chatbot() {
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post("http://localhost:5000/ask", { query });
            setResponse(res.data.response);
        } catch (error) {
            setResponse("Error: Unable to fetch response.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            <h1>Mining Industry Chatbot</h1>
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about mining laws..."
            />
            <button onClick={handleSubmit} className="ask-btn" disabled={loading}>
                {loading ? "Thinking..." : "Ask"}
            </button>
            {response && <p className="response-box">{response}</p>}
        </div>
    );
}

export default Chatbot;
