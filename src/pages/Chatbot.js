import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
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
    FaRobot,
    FaUser,
    FaSearch,
    FaDownload,
    FaSun,
    FaMoon
} from "react-icons/fa";
import "../styles/Chatbot.css";

function Chatbot() {
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [supportedLanguages] = useState([
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'kn', name: 'Kannada' },
        { code: 'te', name: 'Telugu' },
        { code: 'ta', name: 'Tamil' },
        { code: 'mr', name: 'Marathi' }
    ]);
    const [languageMap] = useState({
        'en': 'en-US',
        'hi': 'hi-IN',
        'kn': 'kn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN'
    });
    const [voiceSettings] = useState({
        'en': { rate: 1.0, pitch: 1.0 },
        'hi': { rate: 0.9, pitch: 1.1 },
        'kn': { rate: 0.85, pitch: 1.0 },
        'te': { rate: 0.9, pitch: 1.0 },
        'ta': { rate: 0.85, pitch: 1.1 },
        'mr': { rate: 0.9, pitch: 1.0 }
    });
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
    const [isGreetingPlayed, setIsGreetingPlayed] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good morning";
        if (hour >= 12 && hour < 17) return "Good afternoon";
        if (hour >= 17 && hour < 22) return "Good evening";
        return "Good night";
    };

    const speakGreeting = useCallback(async (text) => {
        if (!isGreetingPlayed) {
            const translatedGreeting = await translateText(text, selectedLanguage, 'en');
            const utterance = new SpeechSynthesisUtterance(translatedGreeting);
            utterance.lang = languageMap[selectedLanguage];
            utterance.rate = voiceSettings[selectedLanguage]?.rate || 0.9;
            utterance.pitch = voiceSettings[selectedLanguage]?.pitch || 1;
            utterance.volume = 1;
            speechSynthesis.speak(utterance);
            setIsGreetingPlayed(true);
        }
    }, [isGreetingPlayed, selectedLanguage, voiceSettings, languageMap]);

    const [searchQuery, setSearchQuery] = useState('');
    const [messageCategory, setMessageCategory] = useState('all');
    const [allQuestions, setAllQuestions] = useState([]);

    const chatAreaRef = useRef(null);
    const recognitionRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || localStorage.getItem('userEmail') || "";
    const [userName] = useState(location.state?.userName || localStorage.getItem('userName') || "Guest");

    useEffect(() => {
        const checkAuth = () => {
            const isAuthenticated = email || localStorage.getItem('userEmail');
            if (!isAuthenticated) {
                navigate('/login', { 
                    state: { 
                        redirect: location.pathname,
                        message: 'Please log in to use the chatbot'
                    }
                });
            }
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [navigate, email, location.pathname]);

    useEffect(() => {
        const greeting = `${getGreeting()} ${userName}`;
        const savedMessages = localStorage.getItem(`chatHistory_${email}`);
        
        if (!savedMessages || savedMessages === '[]') {
            const greetingMessage = {
                type: "bot",
                text: `${greeting}! How can I assist you with Mining Laws?`,
                timestamp: new Date(),
                isGreeting: true
            };
            setMessages([greetingMessage]);
            localStorage.setItem(`chatHistory_${email}`, JSON.stringify([greetingMessage]));
            
            if (!isGreetingPlayed) {
                setTimeout(() => {
                    speakGreeting(greeting);
                }, 1000);
            }
        } else {
            setMessages(JSON.parse(savedMessages));
        }
    }, [userName, email, speakGreeting, isGreetingPlayed]);

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (messages.filter(m => m.type === "user").length > 0) {
            setStats(prev => ({
                ...prev,
                questionsAsked: messages.filter(m => m.type === "user").length,
                lastActive: new Date()
            }));
        }
    }, [messages]);

    const loadSavedData = useCallback(() => {
        try {
            const allSavedQuestions = localStorage.getItem('allQuestions') || '[]';
            const savedHistory = localStorage.getItem(`chatSessions_${email}`) || '[]';
            
            // Parse and filter questions for current user
            const questions = JSON.parse(allSavedQuestions);
            const userQuestions = questions.filter(q => q.email === email);
            
            // Remove duplicates and keep latest
            const uniqueQuestions = userQuestions.reduce((acc, current) => {
                const exists = acc.find(item => item.text.toLowerCase() === current.text.toLowerCase());
                if (!exists) {
                    acc.push(current);
                } else {
                    const index = acc.findIndex(item => item.text.toLowerCase() === current.text.toLowerCase());
                    if (new Date(current.timestamp) > new Date(acc[index].timestamp)) {
                        acc[index] = current;
                    }
                }
                return acc;
            }, []);

            setAllQuestions(uniqueQuestions);

            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }, [email]);

    useEffect(() => {
        loadSavedData();
    }, [loadSavedData]);

    useEffect(() => {
        localStorage.setItem(`chatHistory_${email}`, JSON.stringify(messages));
    }, [messages, email]);

    useEffect(() => {
        try {
            localStorage.setItem(`chatSessions_${email}`, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }, [history, email]);

    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        navigate('/login');
    };

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
        const sections = text.split(/\*\*(.*?)\*\*/).filter(Boolean);
        return sections.map((section, index) => {
            if (index % 2 === 0) {
                return (
                    <div key={index}>
                        {section.split('\n').map((line, i) => {
                            if (line.match(/^\d+\./)) {
                                return <p key={i} style={{ marginLeft: "20px" }}>{line}</p>;
                            } else if (line.match(/^-/)) {
                                return <p key={i} style={{ marginLeft: "20px" }}>• {line.substring(1).trim()}</p>;
                            } else {
                                return <p key={i}>{line}</p>;
                            }
                        })}
                    </div>
                );
            } else {
                return <strong key={index}>{section}</strong>;
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

    const translateText = async (text, targetLang, sourceLang = 'en') => {
        try {
            console.log(`Translating from ${sourceLang} to ${targetLang}: `, text);
            const response = await axios.post("http://localhost:5000/translate", {
                text,
                targetLang,
                sourceLang,
                forceTranslate: true
            });
            console.log('Translation result:', response.data.translatedText);
            return response.data.translatedText;
        } catch (error) {
            console.error("Translation error:", error);
            return text;
        }
    };

    const handleRequestWithTimeout = async (asyncFn) => {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 30000);
        });

        try {
            return await Promise.race([asyncFn(), timeout]);
        } catch (error) {
            if (error.message === 'Request timed out') {
                throw new Error('The request took too long. Please try again.');
            }
            throw error;
        }
    };

    const saveQuestion = (question) => {
        try {
            const questionData = {
                text: question,
                timestamp: new Date(),
                email: email,
                language: selectedLanguage
            };

            const savedQuestions = JSON.parse(localStorage.getItem('allQuestions') || '[]');
            savedQuestions.push(questionData);
            localStorage.setItem('allQuestions', JSON.stringify(savedQuestions));
            setAllQuestions(prev => [...prev, questionData]);
        } catch (error) {
            console.error('Error saving question:', error);
        }
    };

    const removeEmojis = (text) => {
        return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    };

    const handleSubmit = async (e, customQuery = null) => {
        if (e) e.preventDefault();
        if (loading) return;

        const finalQuery = customQuery || query;
        if (!finalQuery.trim()) return;

        setLoading(true);
        saveQuestion(finalQuery);

        // Add user's message immediately
        setMessages(prev => [...prev, {
            type: 'user',
            text: finalQuery,
            timestamp: new Date(),
            language: selectedLanguage
        }]);
        setQuery('');

        try {
            await handleRequestWithTimeout(async () => {
                // Send original query to server without translation
                const response = await axios.post("http://localhost:5000/chatbot", {
                    question: finalQuery,
                    email: email,
                    language: selectedLanguage,
                    originalQuery: finalQuery
                });

                if (!response.data || !response.data.response) {
                    throw new Error("Invalid response from server");
                }

                // Get bot's response
                const botResponse = response.data.response;

                // Translate bot's response to user's selected language
                const translatedResponse = await translateText(botResponse, selectedLanguage, 'en');
                const formattedResponse = formatBotResponse(translatedResponse);

                // Store response
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: formattedResponse,
                    originalText: botResponse,
                    translatedText: translatedResponse,
                    timestamp: new Date(),
                    language: selectedLanguage
                }]);

                // Speak translated response
                if (!isMuted) {
                    await speakResponse(translatedResponse, selectedLanguage);
                }
            });
        } catch (error) {
            console.error('Request failed:', error);
            const errorMessage = await translateText(
                `Error: ${error.message}. Please try again.`,
                selectedLanguage,
                'en'
            );
            setMessages(prev => [...prev, {
                type: 'bot',
                text: errorMessage,
                timestamp: new Date(),
                language: selectedLanguage,
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const speakResponse = async (text, language = selectedLanguage) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        if (isMuted) return;

        const cleanText = removeEmojis(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Enhanced voice settings for more natural speech
        const voiceSettings = {
            'en': { 
                rate: 0.9, 
                pitch: 1.0,
                preferredVoices: [
                    'Google UK English Female',
                    'Microsoft Sonia',
                    'Microsoft Susan',
                    'en-GB-Standard-A',
                    'en-US-Standard-C'
                ],
                volume: 1.0 
            },
            'hi': { 
                rate: 0.85, 
                pitch: 1.0,
                preferredVoices: [
                    'Google hindi',
                    'Microsoft Heera',
                    'Microsoft Swara',
                    'hi-IN-Standard-A'
                ],
                volume: 1.0 
            },
            'kn': { 
                rate: 0.85, 
                pitch: 1.0,
                preferredVoices: [
                    'Google kannada',
                    'Microsoft Keerthi',
                    'kn-IN-Standard-A'
                ],
                volume: 1.0 
            },
            'te': { 
                rate: 0.85, 
                pitch: 1.0,
                preferredVoices: [
                    'Google telugu',
                    'Microsoft Shruthi',
                    'te-IN-Standard-A'
                ],
                volume: 1.0 
            },
            'ta': { 
                rate: 0.85, 
                pitch: 1.0,
                preferredVoices: [
                    'Google tamil',
                    'Microsoft Valluvar',
                    'ta-IN-Standard-A'
                ],
                volume: 1.0 
            },
            'mr': { 
                rate: 0.85, 
                pitch: 1.0,
                preferredVoices: [
                    'Google marathi',
                    'Microsoft Mangal',
                    'mr-IN-Standard-A'
                ],
                volume: 1.0 
            }
        };

        const settings = voiceSettings[language] || voiceSettings['en'];
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
        utterance.lang = languageMap[language];

        // Enhanced voice selection
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = null;

            // First try to find a neural/natural voice
            selectedVoice = voices.find(voice => 
                settings.preferredVoices.some(pv => voice.name.includes(pv)) &&
                (voice.name.includes('Natural') || voice.name.includes('Neural') || !voice.localService)
            );

            // If no neural voice, try preferred voices
            if (!selectedVoice) {
                for (const preferredVoice of settings.preferredVoices) {
                    selectedVoice = voices.find(voice => 
                        voice.name.includes(preferredVoice) || 
                        voice.lang.includes(preferredVoice)
                    );
                    if (selectedVoice) break;
                }
            }

            // Final fallback
            if (!selectedVoice) {
                const langPrefix = language.split('-')[0];
                selectedVoice = voices.find(voice => 
                    voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase()) &&
                    !voice.localService
                );
            }

            if (selectedVoice) {
                console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
                utterance.voice = selectedVoice;
            }

            // Add natural pauses for punctuation
            utterance.text = cleanText.replace(/([.!?])\s*/g, '$1. ');

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length) {
            loadVoices();
        } else {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    };

    const toggleMute = () => {
        setIsMuted(prev => {
            const newMuteState = !prev;
            if (newMuteState) {
                window.speechSynthesis.cancel();
            }
            return newMuteState;
        });
    };

    const startNewChat = () => {
        const greeting = `${getGreeting()} ${userName}! How can I assist you with Mining Laws?`;
        setMessages([{ 
            type: "bot", 
            text: greeting, 
            timestamp: new Date(),
            isGreeting: true 
        }]);
    };

    const clearChat = () => setMessages([]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const startVoiceRecognition = () => {
        if (loading) return;
        try {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error("Speech recognition not supported in this browser");
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            const langCode = languageMap[selectedLanguage];
            recognition.lang = langCode;
            recognition.continuous = false;  // Changed to false to auto-stop
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            let finalTranscript = '';
            let silenceTimer = null;
            let lastSpeechTime = Date.now();

            const SILENCE_TIMEOUT = 2000; // Stop after 2 seconds of silence

            setIsRecording(true);
            setQuery('');

            // Reset silence timer
            const resetSilenceTimer = () => {
                if (silenceTimer) clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                    if (Date.now() - lastSpeechTime > SILENCE_TIMEOUT) {
                        recognition.stop();
                    }
                }, SILENCE_TIMEOUT);
            };

            recognition.onstart = () => {
                console.log('Voice recognition started');
                setIsRecording(true);
                resetSilenceTimer();
            };

            recognition.onaudiostart = () => {
                lastSpeechTime = Date.now();
                resetSilenceTimer();
            };

            recognition.onsoundstart = () => {
                lastSpeechTime = Date.now();
                resetSilenceTimer();
            };

            recognition.onspeechstart = () => {
                lastSpeechTime = Date.now();
                resetSilenceTimer();
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                lastSpeechTime = Date.now();
                resetSilenceTimer();

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                        setQuery(finalTranscript.trim());
                    } else {
                        interimTranscript += transcript;
                        setQuery((finalTranscript + interimTranscript).trim());
                    }
                }
            };

            recognition.onend = () => {
                console.log('Voice recognition ended');
                setIsRecording(false);
                if (silenceTimer) clearTimeout(silenceTimer);
                
                if (finalTranscript.trim()) {
                    handleSubmit(null, finalTranscript.trim());
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsRecording(false);
                
                const errorMessages = {
                    'not-allowed': "Please allow microphone access to use voice input.",
                    'audio-capture': "No microphone detected. Please check your microphone settings.",
                    'network': "Network error occurred. Please check your connection.",
                    'no-speech': "No speech detected. Please try again.",
                    'service-not-allowed': "Speech recognition service not allowed.",
                    'language-not-supported': `Language ${selectedLanguage} is not supported for voice input.`
                };

                const errorMessage = errorMessages[event.error] || "An error occurred with voice recognition.";
                
                setMessages(prev => [...prev, {
                    type: "bot",
                    text: errorMessage,
                    timestamp: new Date()
                }]);
            };

            recognition.start();
            console.log('Starting voice recognition...');

        } catch (error) {
            console.error("Voice recognition setup failed:", error);
            setIsRecording(false);
            setMessages(prev => [...prev, {
                type: "bot",
                text: `Voice recognition error: ${error.message}. Please try typing instead.`,
                timestamp: new Date()
            }]);
        }
    };

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('Voice recognition stopped');
            } catch (error) {
                console.error('Error stopping voice recognition:', error);
            }
        }
        setIsRecording(false);
    };

    const exportChatHistory = () => {
        const history = messages.map(msg => `${msg.timestamp} - ${msg.type}: ${extractTextFromJSX(msg.text)}`).join('\n');
        const blob = new Blob([history], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
    };

    const filterMessages = () => {
        if (!searchQuery && messageCategory === 'all') return messages;
        return messages.filter(msg => {
            const matchesSearch = extractTextFromJSX(msg.text).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = messageCategory === 'all' || msg.type === messageCategory;
            return matchesSearch && matchesCategory;
        });
    };

    const handleLanguageChange = async (newLanguage) => {
        try {
            setLoading(true);
            // Cancel any ongoing speech
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            
            // Update language state
            setSelectedLanguage(newLanguage);
            
            // Translate last bot message if exists
            const lastBotMessage = messages.filter(m => m.type === 'bot').pop();
            if (lastBotMessage && !lastBotMessage.isError && !lastBotMessage.isGreeting) {
                const translatedResponse = await translateText(
                    lastBotMessage.originalText || lastBotMessage.text,
                    newLanguage,
                    'en'
                );
                
                setMessages(prev => prev.map(msg => 
                    msg === lastBotMessage
                        ? {
                            ...msg,
                            text: formatBotResponse(translatedResponse),
                            translatedText: translatedResponse,
                            language: newLanguage
                        }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Language change error:', error);
            // Don't show error message for language change
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        setTheme(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);
    }, []);

    return (
        <div className={`chatbot-container ${theme}-theme`}>
            <div className="sidebar sidebar-left">
                <div className="sidebar-buttons">
                    <button className="new-chat-button" onClick={startNewChat}>
                        <FaPlus /> New Chat
                    </button>
                    <button className="delete-chat-button" onClick={clearChat}>
                        <FaTrash /> Clear Chat
                    </button>
                </div>

                <div className="questions-section">
                    <h3>Previous Questions</h3>
                    <div className="questions-container">
                        {allQuestions.slice().reverse().map((q, index) => (
                            <div 
                                key={index} 
                                className="question-item"
                                onClick={() => handleSubmit(null, q.text)}
                            >
                                <div className="question-content">
                                    <span className="question-text">{q.text}</span>
                                    <span className="question-time">
                                        {new Date(q.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="quick-access-section">
                    <h3>Quick Access</h3>
                    <div className="quick-links-container">
                        {[
                            "Environmental Regulations",
                            "Safety Guidelines",
                            "Licensing Requirements",
                            "Worker Rights",
                            "Equipment Standards",
                            "Compliance Checklist",
                            "Ongoing Projects"
                        ].map((topic, index) => (
                            <div 
                                key={index}
                                className="quick-link-item"
                                onClick={() => handleSubmit(null, 
                                    topic === "Ongoing Projects" 
                                        ? "List all current ongoing mining projects in India with their locations and status" 
                                        : `Tell me about ${topic.toLowerCase()} in mining`
                                )}
                            >
                                <span>{topic}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="chatbot-header">
                    <div className="header-title">
                        <h2>Mining Law Assistant Chatbot</h2>
                    </div>
                    <div className="header-buttons">
                        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            {theme === 'dark' ? <FaSun /> : <FaMoon />}
                        </button>
                    </div>
                </div>

                <div className="chat-header">
                    <div className="header-controls">
                        <div className="language-selector">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                disabled={loading} // Disable during loading
                            >
                                {supportedLanguages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="search-bar">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={messageCategory}
                            onChange={(e) => setMessageCategory(e.target.value)}
                        >
                            <option value="all">All Messages</option>
                            <option value="user">User Messages</option>
                            <option value="bot">Bot Messages</option>
                        </select>
                        <button onClick={exportChatHistory} className="export-button">
                            <FaDownload /> Export Chat
                        </button>
                    </div>
                </div>

                <div className="chat-area" ref={chatAreaRef}>
                    {filterMessages().map((message, index) => (
                        <div key={index} className={`message ${message.type}`}>
                            <div className="message-icon">{message.type === 'user' ? <FaUser /> : <FaRobot />}</div>
                            <div className="message-content">
                                {message.type === 'bot' ? <div>{message.text}</div> : <p>{message.text}</p>}
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
                        onKeyDown={(e) => {
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
                        <button className="mute-button" onClick={toggleMute}>
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

            <div className="sidebar sidebar-right">
                <div className="profile-section">
                    <FaUserCircle className="profile-icon" />
                    <h3>{userName}</h3>
                    <p>{email}</p>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
                <div className="stats-section">
                    <div className="stat-item"><FaQuestion /> <span>Questions Asked: {stats.questionsAsked}</span></div>
                    <div className="stat-item"><FaClock /> <span>Time Spent: {getTimeSpent()}</span></div>
                    <div className="stat-item"><FaClock /> <span>Last Active: {getLastActiveTime()}</span></div>
                </div>
                <div className="expertise-section">
                    <h4>AI Assistant Expertise</h4>
                    <ul>{stats.expertise.map((exp, index) => <li key={index}>{exp}</li>)}</ul>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;
