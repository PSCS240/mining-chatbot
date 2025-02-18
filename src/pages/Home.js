import React from "react";
import { Link } from "react-router-dom";
import '../styles/Home.css';

function Home() {
    return (
        <div className="home-container">
            <h1>Welcome to Mining Chatbot</h1>
            <p>Your intelligent assistant for mining insights.</p>
            <div className="home-buttons">
                <Link to="/login" className="btn login">Login</Link>
                <Link to="/register" className="btn register">Register</Link>
            </div>
        </div>
    );
}

export default Home;