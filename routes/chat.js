const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Asus@2024.",
    database: "mining_chatbot",
});

// ✅ Store User Chat History
app.post("/save-chat", (req, res) => {
    const { email, query, response } = req.body;

    const sql = "INSERT INTO chat_history (user_email, query, response) VALUES (?, ?, ?)";
    db.query(sql, [email, query, response], (err, result) => {
        if (err) {
            console.error("Error saving chat:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Chat saved successfully" });
    });
});

// ✅ Fetch User Chat History
app.get("/get-chat-history", (req, res) => {
    const { email } = req.query;

    const sql = "SELECT query, response, timestamp FROM chat_history WHERE user_email = ? ORDER BY timestamp DESC";
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error("Error fetching chat history:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, history: result });
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
