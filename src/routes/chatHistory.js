const express = require('express');
const router = express.Router();
const ChatHistory = require('../models/ChatHistory');
const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);

// Get all chats for a user
router.get('/chat-history', async (req, res) => {
    try {
        const { userId } = req.query;
        const chats = await ChatHistory.find({ userId })
            .sort({ timestamp: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching chat history' });
    }
});

// Get specific chat
router.get('/chat-history/:id', async (req, res) => {
    try {
        const chat = await ChatHistory.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching chat' });
    }
});

// Save new chat
router.post('/save-chat', async (req, res) => {
    try {
        const { userId, question, answer } = req.body;
        
        // Format the answer with proper line breaks
        let formattedAnswer = answer;
        
        // Check if it's an overview/list type response
        if (answer.includes('**Overview') || answer.includes('Key Provisions')) {
            // Split the text into sections
            const sections = answer.split('**').filter(Boolean);
            
            formattedAnswer = sections.map(section => {
                // For each section, format numbered points
                if (section.includes('1.')) {
                    const [title, ...points] = section.split(/\d+\./).filter(Boolean);
                    return `**${title.trim()}**\n\n${points.map((point, index) => 
                        `${index + 1}. ${point.trim()}`
                    ).join('\n\n')}`;
                }
                return section;
            }).join('\n\n');
        }

        const newChat = new ChatHistory({
            userId,
            question,
            answer: formattedAnswer
        });

        await newChat.save();
        res.json(newChat);
    } catch (error) {
        res.status(500).json({ error: 'Error saving chat' });
    }
});

// Delete chat
router.delete('/chat-history/:id', async (req, res) => {
    try {
        await ChatHistory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting chat' });
    }
});

module.exports = router;
