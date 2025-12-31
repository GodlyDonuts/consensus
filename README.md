# DevDraft AI: Voice-to-Code Requirements Engine

**DevDraft AI** is a Chrome Extension and Python Backend that listens to client meetings, extracts project requirements in real-time, and generates prompts for agentic coding tools like Lovable, Bolt.new, and Replit.

It uses **Deepgram** for speech-to-text and **Google Gemini** for intelligent requirement extraction, automatically handling "changed mind" scenarios where the latest instructions override previous ones.

---

## 🏗 System Architecture

### 1. Frontend (Chrome Extension)
- **Tech Stack**: React 18, Vite, TypeScript, Chrome Manifest V3
- **Location**: `/extension`
- **Features**:
    - Captures tab/desktop audio using `navigator.mediaDevices.getDisplayMedia`
    - Real-time audio visualization
    - **Project North Star**: Live 1-sentence project summary
    - **Requirements Feed**: Auto-updating list with pulse animation for new items
    - **Smart Override Tracking**: Visual strike-through for superseded requirements
    - **Build Button**: Copy prompt to clipboard and redirect to agentic tools

### 2. Backend (Requirement Extraction Engine)
- **Tech Stack**: Python 3.10+, FastAPI, WebSockets
- **Location**: `/backend`
- **Features**:
    - **Transcription**: Real-time speech-to-text via **Deepgram Nova-2**
    - **Requirement Extraction**: Uses **Google Gemini** as a "Senior Product Manager"
    - **Instruction Hierarchy**: Latest instructions override previous ones
    - **30-Word Trigger**: Analyzes every ~30 words for responsive updates
    - **Context Memory**: Maintains full transcript for reconciling changes

---

## ⚡ Key Features

### 🎯 Instruction Hierarchy
When clients change their mind ("Actually, use a sidebar instead of a navbar"), DevDraft AI:
1. Marks the old requirement as "superseded"
2. Creates a new "active" requirement
3. Shows visual strike-through in the UI

### 📋 Live PRD Generation
As the conversation progresses, DevDraft AI builds a structured specification:
- Project summary (North Star)
- Tech stack suggestions
- Feature requirements with status tracking
- UI/UX preferences

### 🚀 Agentic Tool Integration
One-click export to coding tools:
- **Lovable** - AI-powered app builder
- **Bolt.new** - Full-stack web app generator
- **Replit Agent** - Collaborative AI coding
- **v0 by Vercel** - React component generator

### 🔨 Built-in Code Generation
DevDraft AI can **generate complete React projects** directly - no external tools needed:
1. Click **"Generate Code"** after requirements are extracted
2. AI generates a full Vite + React project with all files
3. Preview code in the built-in file viewer
4. Download as a ZIP file ready to run with `npm install && npm run dev`

---

## 🛠 Setup & Usage

### Prerequisites
- Python 3.10+
- Node.js 18+
- API Keys:
    - `DEEPGRAM_API_KEY`
    - `GEMINI_API_KEY`

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
echo "DEEPGRAM_API_KEY=your_key" > .env
echo "GEMINI_API_KEY=your_key" >> .env

# Run Server
uvicorn main:app --reload
```
*Server runs on `ws://localhost:8000`*

### 2. Frontend Setup
```bash
cd extension
npm install
npm run build
```
1. Open Chrome -> `chrome://extensions`
2. Enable "Developer Mode"
3. Click "Load Unpacked" -> Select `extension/dist`

### 3. Using DevDraft AI
1. Open the Chrome Side Panel
2. Ensure Backend is running
3. Click **Start Capture**
4. Select the tab/screen with client meeting audio (Check "Share Audio")
5. Speak or play meeting audio - requirements will appear in real-time
6. Choose your output method:
   - **Generate Code**: Creates a complete React project (download as ZIP)
   - **Export to Tool**: Copies prompt to clipboard and opens Lovable/Bolt.new

---

## 🧩 API Schema

The backend outputs structured JSON via WebSocket:

```json
{
    "project_summary": "A dashboard for crypto tracking",
    "requirements": [
        {"id": 1, "description": "Dark mode UI", "status": "active"},
        {"id": 2, "description": "Use sidebar navigation", "status": "active", "supersedes": 3},
        {"id": 3, "description": "Use navbar navigation", "status": "superseded"}
    ],
    "tech_stack": ["React", "Tailwind", "Lucide Icons"],
    "ui_preferences": ["Dark theme", "Minimal design"],
    "raw_transcript_snapshot": "..."
}
```

### Message Types
| Type | Direction | Description |
|------|-----------|-------------|
| `start_capture` | Client → Server | Begin transcription session |
| `stop_capture` | Client → Server | End session |
| `transcript` | Server → Client | Real-time transcript chunk |
| `word_count` | Server → Client | Current word count progress |
| `project_spec` | Server → Client | Updated project specification |

---

## 📂 Project Structure

```
/
├── backend/
│   ├── main.py              # FastAPI + Deepgram + Gemini
│   ├── code_generator.py    # AI code generation service
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # API keys
├── extension/
│   ├── src/
│   │   ├── sidepanel.tsx    # Main DevDraft UI
│   │   ├── components/
│   │   │   ├── AudioVisualizer.tsx
│   │   │   └── CodePreview.tsx  # Generated code viewer
│   │   ├── utils/
│   │   │   ├── promptGenerator.ts
│   │   │   └── zipGenerator.ts  # ZIP download utility
│   │   └── index.css        # DevDraft styling
│   ├── manifest.json        # Chrome Extension config
│   └── vite.config.ts       # Build config
└── README.md
```

---

## 🔮 Future Enhancements

- [x] ~~Direct API integration with agentic tools~~ → Built-in code generation!
- [ ] Speaker diarization (identify who said what)
- [ ] Priority/complexity scoring for requirements
- [ ] Export to Jira/Linear/GitHub Issues
- [ ] Team collaboration features
- [ ] Iterative refinement ("Add a login page to the existing project")
