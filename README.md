# Virtual Assistant

A modern voice-enabled virtual assistant built with React + Vite on the frontend and Node.js + Express on the backend. The app supports user authentication, assistant customization, voice interactions, and AI-powered automation for tasks like web navigation, YouTube searches, and general chat.

## Features

- User signup and login with JWT-based authentication
- Assistant customization with a custom name and image
- Voice assistant experience with speech recognition and speech synthesis
- Dynamic wake-word detection for a custom assistant name
- AI-powered chat responses and action routing
- Browser automation for URLs, YouTube play/search requests, and Google search
- Responsive UI with a polished dashboard experience

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Cloudinary for image uploads
- Groq/Grok-based AI response handling
- Tavily web search support

## Project Structure

```text
virtual-assistant/
├── backend/
│   ├── config/
│   ├── controller/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── test/
│   ├── gemini.js
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm or yarn
- MongoDB instance
- Cloudinary account (for image uploads)
- Groq or Grok API key
- Tavily API key (optional, for live web search enhancement)

## Environment Variables

Create a `.env` file inside the backend folder with the following variables:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API=your_cloudinary_api_key
CLOUDINARY_SECRETKEY=your_cloudinary_secret
GROQ_API_KEY=your_groq_or_grok_api_key
TAVILY_API_KEY=your_tavily_api_key
```

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd virtual-assistant
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

## Running the App

### Start the backend

```bash
cd backend
npm run dev
```

The backend will run on:

```text
http://localhost:8000
```

### Start the frontend

```bash
cd frontend
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## Usage

1. Open the frontend in your browser.
2. Sign up or sign in.
3. Customize your assistant name and image.
4. Start voice chat and speak to your assistant.
5. Try commands like:
   - "Hey Jarvis, open GitHub"
   - "Play Shape of You on YouTube"
   - "Search weather in Mumbai"

## Notes

- Voice features require browser microphone permission.
- The wake-word system is designed to work with your customized assistant name and similar variations.
- Some AI features depend on valid API credentials in the backend environment.

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Run frontend build:

```bash
cd frontend
npm run build
```
