# 🎙 Voice AI Assistant

### Real-Time Conversational AI System

------------------------------------------------------------------------

## 🚀 Project Overview

Voice AI Assistant is a real-time conversational system that enables
seamless voice interaction with an AI model.

It integrates:

-   **Deepgram** -- Real-time Speech-to-Text (STT) & Text-to-Speech
    (TTS)
-   **Groq LLM** -- Intelligent response generation
-   **WebSockets** -- Low-latency streaming communication
-   **SQLite** -- Structured data persistence
-   **Modern Frontend (Vanilla JS)** -- ChatGPT-inspired UI

The system allows users to:

1.  🎤 Speak naturally
2.  🧠 Receive intelligent AI responses
3.  🔊 Hear responses via voice playback
4.  💾 Store structured data
5.  💬 Manage multiple chat sessions

------------------------------------------------------------------------

## 🏗 System Architecture

    Browser (Microphone)
            ↓
    WebSocket (Client → Server)
            ↓
    Deepgram Real-Time STT
            ↓
    Groq LLM Processing
            ↓
    Deepgram TTS
            ↓
    Audio Playback (Browser)

The backend is fully asynchronous and optimized for real-time streaming.

------------------------------------------------------------------------

## ✨ Features

### 🔹 Core Features

-   Real-time speech transcription
-   Intelligent conversational responses
-   Text-to-speech playback
-   Full-duplex WebSocket architecture

### 🔹 Advanced Capabilities

-   Conversation recording (WAV format)
-   Structured data extraction (e.g., name, request, date)
-   SQLite-based logging
-   Interruption handling (user can cut off bot speech)
-   Multi-session chat sidebar (ChatGPT-style)
-   Rename & delete chat sessions
-   Smart session titles (auto-generated from first message)
-   Word-by-word typing animation
-   Blinking cursor effect
-   Markdown rendering support
-   Dark / Light theme toggle
-   Smooth auto-scroll UX

------------------------------------------------------------------------

## 📁 Project Structure

    Voice_AI_Assistant/
    │
    ├── server/
    │   ├── main.py
    │   ├── config.py
    │   ├── llm.py
    │   ├── tools.py
    │   ├── database.py
    │   └── requirements.txt
    │
    ├── client/
    │   ├── index.html
    │   ├── style.css
    │   └── script.js
    │
    ├── database/
    │   └── conversations.db
    │
    ├── recordings/
    │   └── (Saved WAV files)
    │
    ├── README.md
    └── .gitignore

------------------------------------------------------------------------

## ⚙️ Setup Instructions

### 1️⃣ Install Dependencies

``` bash
cd server
pip install -r requirements.txt
```

### 2️⃣ Configure API Keys

Create a `.env` file inside the `server/` directory:

    DEEPGRAM_API_KEY=your_deepgram_key
    GROQ_API_KEY=your_groq_key

⚠️ Do NOT commit this file to GitHub.

------------------------------------------------------------------------

### 3️⃣ Start Backend Server

``` bash
python main.py
```

Server runs at:

    ws://localhost:8765

------------------------------------------------------------------------

### 4️⃣ Start Frontend

``` bash
cd client
python -m http.server 5500
```

Open in browser:

    http://localhost:5500

Allow microphone access when prompted.

------------------------------------------------------------------------

## 🗃 Database

Structured data extracted from conversations is stored in:

    database/conversations.db

This enables logging and future analytics expansion.

------------------------------------------------------------------------

## 🔐 Best Practices Implemented

-   Environment variables isolated via `.env`
-   Proper `.gitignore` configuration
-   Modular backend architecture
-   Error handling for WebSocket streaming
-   Async backend for scalability
-   Clean UI with persistent session management

------------------------------------------------------------------------

## 🏆 Technical Highlights

-   Fully asynchronous Python backend
-   Direct Deepgram WebSocket streaming
-   Custom PCM audio encoding (16-bit, 16kHz)
-   Persistent multi-session chat architecture
-   Modern AI-inspired UI design
-   Clean and scalable folder structure

------------------------------------------------------------------------

## 👤 Author

Vineet Peerapur

------------------------------------------------------------------------

## 📌 Conclusion

This project demonstrates:

-   Real-time streaming systems
-   AI integration architecture
-   Voice processing pipelines
-   Persistent session management
-   Full-stack development skills
-   Clean UI/UX implementation

Designed with production-level structure and extensibility in mind.
