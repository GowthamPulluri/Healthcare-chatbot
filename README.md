# Healthcare Chatbot System

A full-stack healthcare chatbot application built with Next.js, TypeScript, and MongoDB. The system provides AI-powered medical assistance with multilingual support (English, Hindi, Telugu) and personalized health advice based on user profiles.

## Features

- **User Authentication**: Secure login/signup system with JWT tokens
- **Multilingual Support**: Chat in English, Hindi, or Telugu
- **NLP Processing**: Intent detection and entity extraction for medical queries
- **LLM Integration**: Powered by Google Gemini for intelligent, contextual responses
- **Medical Knowledge Base**: Responses for common symptoms, diseases, and treatments
- **User Profiles**: Manage personal information and allergy records
- **Real-time Chat**: Interactive chat interface with message history
- **Emergency Detection**: Automatic detection of emergency medical situations
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **LLM**: Google Gemini 1.5 Flash for intelligent responses
- **NLP**: Natural language processing with the `natural` library
- **Translation**: Google Translate API for multilingual support
- **Icons**: Lucide React icons

## Prerequisites

- Node.js 18+ 
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/healthcare-chatbot
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # LLM Configuration (Google Gemini)
   USE_LLM=true
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key-here
   LLM_MODEL=gemini-1.5-flash
   ```
   
   **To get a Gemini API key:**
   1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   2. Sign in with your Google account
   3. Create a new API key
   4. Copy the key and replace `your-gemini-api-key-here` in `.env.local`

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB
   mongod
   
   # Or use MongoDB Atlas connection string in MONGODB_URI
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Getting Started

1. **Sign Up**: Create a new account with your email, password, name, and preferred language
2. **Login**: Sign in with your credentials
3. **Set Profile**: Add your allergies and personal information in the Profile section
4. **Start Chatting**: Ask health-related questions in your preferred language

### Supported Queries

The chatbot can handle various types of health-related queries:

- **Symptom Inquiries**: "What are the symptoms of fever?"
- **Disease Information**: "Tell me about diabetes"
- **Medication Queries**: "What medicine should I take for headache?"
- **General Health**: "How to maintain good health?"
- **Emergency Detection**: Automatically detects emergency situations

### Languages Supported

- **English**: Default language
- **Hindi**: हिंदी में स्वास्थ्य सलाह
- **Telugu**: ఆరోగ్య సలహా తెలుగులో

### LLM Integration

The chatbot uses **Google Gemini 1.5 Flash** for generating intelligent, contextual responses. Here's how it works:

1. **Input Processing**: User messages are processed through NLP to detect intent and extract medical entities
2. **Context Building**: The system builds a comprehensive prompt including:
   - User's medical query
   - Detected intent and entities
   - User's allergy information
   - Chat history for context
   - Language preferences
3. **LLM Generation**: Gemini generates responses with:
   - Medical advice and information
   - Personalized suggestions
   - Emergency detection
   - Follow-up questions
4. **Fallback System**: If LLM fails, the system falls back to the static medical knowledge base

**Response Format**: The LLM returns structured JSON with:
```json
{
  "response": "Main response text",
  "suggestions": ["suggestion1", "suggestion2"],
  "emergency": false,
  "followUp": "Optional follow-up question",
  "confidence": 0.8
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Chat
- `POST /api/chat` - Send message to chatbot
- `GET /api/chat` - Get chat history

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

## Project Structure

```
healthcare-chatbot/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── chat/      # Chat endpoints
│   │   │   └── profile/   # Profile endpoints
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── components/         # React components
│   │   ├── LoginForm.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ProfilePage.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/               # Utility libraries
│   │   ├── mongodb.ts     # Database connection
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── nlp.ts         # NLP processing
│   │   ├── translation.ts # Translation utilities
│   │   └── medical-knowledge.ts # Medical knowledge base
│   └── models/            # Database models
│       ├── User.ts
│       └── Chat.ts
├── .env.local             # Environment variables
├── package.json
└── README.md
```

## Database Schema

### User Model
```typescript
{
  email: string (unique)
  password: string (hashed)
  name: string
  allergies: string[]
  preferredLanguage: 'en' | 'hi' | 'te'
  createdAt: Date
  updatedAt: Date
}
```

### Chat Model
```typescript
{
  userId: ObjectId (ref: User)
  messages: [{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    language?: string
  }]
  createdAt: Date
  updatedAt: Date
}
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation on all API endpoints
- CORS protection
- Environment variables for sensitive data

## Limitations

- This is an MVP (Minimum Viable Product) for demonstration purposes
- Medical advice should not replace professional medical consultation
- Translation accuracy may vary
- NLP capabilities are basic and can be enhanced

## Future Enhancements

- Integration with real medical databases
- Voice input/output support
- Appointment booking system
- Integration with healthcare providers
- Advanced NLP with machine learning models
- Mobile app development
- Real-time notifications
- Medical image analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This healthcare chatbot is for educational and demonstration purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.