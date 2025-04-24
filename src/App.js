import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Chatbot from "./pages/Chatbot";
import OTPVerification from "./pages/OTPVerification";

function App() {
    const [companyName, setCompanyName] = useState("");
    const [userEmail, setUserEmail] = useState("");

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register setUserEmail={setUserEmail} />} />
                <Route path="/verify-otp" element={<OTPVerification email={userEmail} />} />
                <Route path="/login" element={<Login setCompanyName={setCompanyName} />} />
                <Route path="/chatbot" element={<Chatbot companyName={companyName} email={userEmail} />} />
            </Routes>
        </Router>
    );
}

export default App;
