# Mining Law Assistant Chatbot

A multilingual conversational AI assistant specialized in mining laws and regulations, featuring voice interaction and real-time language translation.

## Features

### Multilingual Support
- Supports 6 Indian languages:
  - English
  - Hindi
  - Kannada
  - Telugu
  - Tamil
  - Marathi
- Real-time translation
- Voice recognition and synthesis

### Interactive Interface
- Voice and text input options
- Real-time responses
- Theme customization (Dark/Light)
- Chat history management
- Quick access shortcuts

### Core Functionalities
- Mining law consultation
- Safety regulations guidance
- Environmental compliance assistance
- Real-time language switching
- Voice-enabled interactions

## Technical Stack

### Frontend
- React.js
- React Router
- Web Speech API
- LocalStorage/SessionStorage
- Axios for HTTP requests

### Backend
- Node.js
- Express.js
- Translation Services
- Speech Recognition
- MongoDB/PostgreSQL

## Getting Started

### Prerequisites
```bash
node.js >= 14.0.0
npm >= 6.14.0
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/mining-chatbot.git
cd mining-chatbot
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

4. Build for production
```bash
npm run build
```

## Project Structure

```plaintext
mining-chatbot/
├── src/
│   ├── pages/
│   │   └── Chatbot.js       # Main chatbot component
│   ├── styles/
│   │   └── Chatbot.css      # Styling
│   ├── components/          # Reusable components
│   └── services/           # API services
├── public/
│   └── index.html          # HTML template
└── package.json           # Dependencies
```

## Features in Detail

### User Interface
- Responsive chat interface
- Language selection dropdown
- Voice control buttons
- Theme toggle
- Search functionality
- Message filtering

### Chat Features
- Text input
- Voice input/output
- Message history
- Export functionality
- Quick access links

### Language Processing
- Real-time translation
- Voice recognition
- Speech synthesis
- Multiple language support

## Usage Examples

### Text Interaction
```javascript
// Ask about mining regulations
"What are the safety requirements for underground mining?"

// Query environmental guidelines
"Explain environmental compliance for open-pit mining"
```

### Voice Commands
- Press microphone button
- Speak your query
- Receive voiced response

### Language Switching
1. Select language from dropdown
2. Continue conversation in selected language
3. Receive responses in selected language

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Web Speech API for voice features
- Translation services
- Mining law databases
- React.js community
