# <img src="https://raw.githubusercontent.com/GodlyDonuts/consensus/main/landing/public/logo.png" width="40" height="40" style="vertical-align: middle; margin-right: 10px;"> DevDraft AI

<div align="center">
  <h3>Meetings to Code. Fast.</h3>
  <p>An intelligent requirement extraction engine that listens to client meetings, handles pivots in real-time, and generates production-ready code.</p>
</div>

---

## 🚀 Overview

**DevDraft AI** is a multi-modal agentic tool designed for high-stress hackathons and rapid prototyping. It acts as an AI Senior Product Manager that joins your meetings, understands context, and converts spoken requirements directly into code.

### ⚡ Key Features
- **Real-Time Pivot Handling**: "Actually, let's use Supabase instead of Firebase." → *DevDraft immediately updates the specs and strikes through the old requirement.*
- **Live PRD Generation**: Generates a structured Product Requirement Document (PRD) on the fly.
- **Instant Code Generation**: One-click generation of a full React + Vite + Tailwind project.
- **Agentic Tool Integration**: Exports optimized prompts for **Lovable**, **Bolt.new**, and **Replit Agent**.

---

## 🏗 System Architecture

The project consists of three main components:

| Component | Location | Tech Stack | Description |
|-----------|----------|------------|-------------|
| **Extension** | `/extension` | React 19, Vite, Chrome Manifest V3 | The side-panel companion that captures audio and displays the live feed. |
| **Web Dashboard** | `/landing` | React 19, Tailwind, Framer Motion | The browser-based experience for users without the extension. |
| **Cloud Backend** | `/backend` | Python 3.10, FastAPI, Gemini 1.5 Pro | The brain. Handles transcription (Deepgram), logic (Gemini), and code generation. |

---

## 🛠 Quick Start (Web Dashboard)

You don't need to install anything to try DevDraft AI.

1. Go to the [Live Demo](https://devdraft-landing.vercel.app/)
2. Click **"Try Web Demo"**
3. Grant microphone permissions
4. Start speaking requirements (e.g., *"Build a to-do app with dark mode..."*)
5. Watch the PRD build itself in real-time.

---

## 📦 Installation (Chrome Extension)

For the full deeply integrated experience:

1. **Download**: Get the latest `DEVDRAFT.zip` from the [Landing Page](https://devdraft-landing.vercel.app/).
2. **Install**:
   - Open `chrome://extensions`
   - Enable **Developer Mode** (top right)
   - Click **Load Unpacked**
   - Select the unzipped folder
3. **Run**: Open the Side Panel in any tab to start analyzing.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (optional)

### 1. Backend
The backend is cloud-native but can be run locally.

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Keys required in .env: DEEPGRAM_API_KEY, GEMINI_API_KEY
uvicorn main:app --reload
```

### 2. Landing Page & Dashboard
```bash
cd landing
npm install
npm run dev
```

### 3. Extension
```bash
cd extension
npm install
npm run build
# Load ./dist into Chrome
```

---

## 🧠 AI Model Pipeline

1. **Hearing (Deepgram Nova-2)**: Streams audio to text with <300ms latency.
2. **Understanding (Gemini 1.5 Pro)**:
   - Analyzes transcripts in 30-word chunks.
   - Maintains a "Concept Graph" to detect conflicts.
   - **Instruction Hierarchy**: New instructions with higher timestamps override older conflicting nodes.
3. **Building (Gemini 2.0 Flash)**:
   - **Planning Phase**: Architects the folder structure.
   - **Coding Phase**: parallelized file generation.

---

## 📄 License

MIT License. Built for the future of coding.
