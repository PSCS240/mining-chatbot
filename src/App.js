import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chatbot from "./pages/Chatbot";

function App() {
    const [companyName, setCompanyName] = useState("");

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                {/* ✅ Pass setCompanyName to Login */}
                <Route path="/login" element={<Login setCompanyName={setCompanyName} />} />
                {/* ✅ Pass companyName to Chatbot */}
                <Route path="/chatbot" element={<Chatbot companyName={companyName} />} />
            </Routes>
        </Router>
    );
}

export default App;
