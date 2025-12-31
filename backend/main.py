import os
import json
import asyncio
import hashlib
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions,
)
from google import genai
from cerebras.cloud.sdk import Cerebras
from cachetools import TTLCache
from code_generator import generate_project_code

load_dotenv()

app = FastAPI()

# Validate API Keys
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

if not DEEPGRAM_API_KEY:
    print("WARNING: DEEPGRAM_API_KEY is missing")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is missing")
if not CEREBRAS_API_KEY:
    print("WARNING: CEREBRAS_API_KEY is missing")

# Initialize Deepgram
try:
    if DEEPGRAM_API_KEY:
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    else:
        deepgram = None
except Exception as e:
    print(f"Failed to init Deepgram: {e}")
    deepgram = None

# Initialize Gemini Client (for code generation)
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None

# Initialize Cerebras Client (for requirement extraction)
if CEREBRAS_API_KEY:
    cerebras_client = Cerebras(api_key=CEREBRAS_API_KEY)
else:
    cerebras_client = None

# Cache for requirement extraction (TTL: 5 minutes, max 100 entries)
# Key: hash of transcript, Value: extracted requirements
extraction_cache = TTLCache(maxsize=100, ttl=300)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DevDraft AI Backend is Running"}


# ============================================================================
# Pydantic Models for API
# ============================================================================

class Requirement(BaseModel):
    id: int
    description: str
    status: str  # "active" or "superseded"
    supersedes: Optional[int] = None

class ProjectSpec(BaseModel):
    project_summary: str
    requirements: List[Requirement]
    tech_stack: List[str] = []
    ui_preferences: List[str] = []
    raw_transcript_snapshot: Optional[str] = None

class GenerateCodeRequest(BaseModel):
    project_spec: ProjectSpec

class GeneratedFile(BaseModel):
    path: str
    content: str

class GenerateCodeResponse(BaseModel):
    success: bool
    project_name: str = "devdraft-project"
    files: List[GeneratedFile] = []
    setup_commands: List[str] = []
    description: str = ""
    error: Optional[str] = None


# ============================================================================
# Code Generation API Endpoint
# ============================================================================

@app.post("/api/generate", response_model=GenerateCodeResponse)
async def generate_code(request: GenerateCodeRequest):
    """Generate a complete React project from the project specification."""
    if not gemini_client:
        return GenerateCodeResponse(
            success=False,
            error="Gemini API client not initialized. Check GEMINI_API_KEY."
        )
    
    print(f"[DevDraft] Generating code for: {request.project_spec.project_summary}")
    
    # Convert Pydantic model to dict for the generator
    spec_dict = request.project_spec.model_dump()
    
    result = await generate_project_code(spec_dict, gemini_client)
    
    return GenerateCodeResponse(
        success=result.get("success", False),
        project_name=result.get("project_name", "devdraft-project"),
        files=[GeneratedFile(path=f["path"], content=f["content"]) for f in result.get("files", [])],
        setup_commands=result.get("setup_commands", []),
        description=result.get("description", ""),
        error=result.get("error")
    )


# ============================================================================
# DevDraft AI: Requirement Extraction Engine
# ============================================================================

SYSTEM_PROMPT = """You are a Senior Product Manager and Requirements Engineer. Your job is to analyze client conversation transcripts and extract structured technical project requirements.

CRITICAL RULES:
1. **Instruction Hierarchy (Latest Trumps Previous)**: If a user changes their mind during the conversation (e.g., "Actually, use a sidebar instead of a navbar"), the latest instruction is the ABSOLUTE TRUTH. Mark the old requirement as "superseded" and create a new "active" requirement.

2. **Requirement Tracking**: Each requirement needs a unique numeric ID. When a requirement supersedes another, include "supersedes": <old_id> in the new requirement.

3. **Context Awareness**: I will provide the full transcript. Prioritize the most recent ~200 words for detecting active changes, but use the full history to understand the overall project.

4. **Output Format**: Strictly valid JSON matching this schema:
{
    "project_summary": "<One sentence describing what is being built>",
    "requirements": [
        {"id": 1, "description": "<requirement text>", "status": "active"},
        {"id": 2, "description": "<superseding requirement>", "status": "active", "supersedes": 3},
        {"id": 3, "description": "<old requirement>", "status": "superseded"}
    ],
    "tech_stack": ["<technology1>", "<technology2>"],
    "ui_preferences": ["<preference1>", "<preference2>"]
}

5. **Incremental Updates**: If I provide a previous_spec, merge your new findings with it. Maintain existing IDs and only add new requirements or supersede old ones.

6. **Be Specific**: Extract concrete, actionable requirements. Avoid vague statements.
"""


async def analyze_transcript(current_text: str, full_history: list, previous_spec: dict = None):
    """
    Analyzes the meeting transcript to extract project requirements.
    Uses Cerebras Llama 3.3 70B for extraction (fast and efficient).
    Implements caching to reduce API costs.
    """
    if not cerebras_client:
        print("[DevDraft] Cerebras client not initialized, falling back to Gemini")
        return await analyze_transcript_gemini(current_text, full_history, previous_spec)
    
    # Build the full transcript
    full_transcript = " ".join(full_history)
    
    # Check cache first
    cache_key = hashlib.md5(full_transcript.encode()).hexdigest()
    if cache_key in extraction_cache and previous_spec is None:
        print(f"[DevDraft] Cache hit for transcript")
        return extraction_cache[cache_key]
    
    # Identify recent context (last ~200 words for priority)
    words = full_transcript.split()
    recent_words = words[-200:] if len(words) > 200 else words
    recent_context = " ".join(recent_words)
    
    # Build the prompt
    prompt_parts = [SYSTEM_PROMPT, "\n\n"]
    
    if previous_spec:
        prompt_parts.append(f"PREVIOUS SPECIFICATION (maintain and update):\n{json.dumps(previous_spec, indent=2)}\n\n")
    
    prompt_parts.append(f"FULL TRANSCRIPT:\n{full_transcript}\n\n")
    prompt_parts.append(f"RECENT CONTEXT (prioritize for changes):\n{recent_context}\n\n")
    prompt_parts.append("Analyze the transcript and output the updated project specification as JSON. Output ONLY the JSON, no other text.")
    
    final_prompt = "".join(prompt_parts)
    
    print(f"[DevDraft] Analyzing with Cerebras Llama 3.3... Transcript: {len(full_transcript)} chars")
    
    try:
        # Use Cerebras Llama 3.3 70B for extraction
        response = cerebras_client.chat.completions.create(
            model="llama-3.3-70b",
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Output valid JSON and nothing else."},
                {"role": "user", "content": final_prompt}
            ],
            max_tokens=4096,
            temperature=0.3,  # Lower temperature for more deterministic output
        )
        
        text_response = response.choices[0].message.content
        text_response = text_response.replace("```json", "").replace("```", "").strip()
        result = json.loads(text_response)
        
        # Add raw transcript snapshot
        result["raw_transcript_snapshot"] = full_transcript
        
        # Cache the result
        extraction_cache[cache_key] = result
        
        return result
    except Exception as e:
        print(f"[DevDraft] Cerebras extraction error: {e}, falling back to Gemini")
        return await analyze_transcript_gemini(current_text, full_history, previous_spec)


async def analyze_transcript_gemini(current_text: str, full_history: list, previous_spec: dict = None):
    """Fallback to Gemini if Cerebras fails."""
    if not gemini_client:
        return None
    
    full_transcript = " ".join(full_history)
    words = full_transcript.split()
    recent_words = words[-200:] if len(words) > 200 else words
    recent_context = " ".join(recent_words)
    
    prompt_parts = [SYSTEM_PROMPT, "\n\n"]
    if previous_spec:
        prompt_parts.append(f"PREVIOUS SPECIFICATION:\n{json.dumps(previous_spec, indent=2)}\n\n")
    prompt_parts.append(f"FULL TRANSCRIPT:\n{full_transcript}\n\n")
    prompt_parts.append(f"RECENT CONTEXT:\n{recent_context}\n\n")
    prompt_parts.append("Output the project specification as JSON.")
    
    try:
        response = await gemini_client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents="".join(prompt_parts),
            config={'response_mime_type': 'application/json'}
        )
        result = json.loads(response.text.replace("```json", "").replace("```", "").strip())
        result["raw_transcript_snapshot"] = full_transcript
        return result
    except Exception as e:
        print(f"[DevDraft] Gemini extraction error: {e}")
        return None


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[DevDraft] Client connected")
    
    # Session State
    full_history = []  
    trigger_buffer = [] 
    current_spec = None  # Stores the latest project specification
    next_requirement_id = 1  # Track requirement IDs
    
    dg_connection = None
    deepgram_active = False

    if not deepgram:
        print("[DevDraft] Deepgram not initialized")
    
    loop = asyncio.get_running_loop()

    try:
        while True:
            message = await websocket.receive()
            
            if message["type"] == "websocket.disconnect":
                print("[DevDraft] Client sent disconnect payload")
                break
            
            # --- 1. Text Control Messages (JSON) ---
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    command = data.get("type")
                    print(f"[DevDraft] Received command: {command}")

                    if command == "start_capture":
                        print("[DevDraft] Starting new capture session...")
                        full_history = []
                        trigger_buffer = []
                        current_spec = None
                        next_requirement_id = 1

                        dg_connection = deepgram.listen.live.v("1")

                        def on_message(self, result, **kwargs):
                            try:
                                sentence = result.channel.alternatives[0].transcript
                                if len(sentence) > 0:
                                    print(f"[DevDraft] Transcript: {sentence}")
                                    full_history.append(sentence)
                                    trigger_buffer.append(sentence)
                                    asyncio.run_coroutine_threadsafe(
                                        websocket.send_text(json.dumps({"type": "transcript", "data": sentence})),
                                        loop
                                    )
                            except Exception as e: 
                                print(f"[DevDraft] Error in on_message: {e}")

                        def on_error(self, error, **kwargs):
                            print(f"[DevDraft] Deepgram Error: {error}")

                        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
                        dg_connection.on(LiveTranscriptionEvents.Error, on_error)

                        options = LiveOptions(model="nova-2", language="en-US", smart_format=True, interim_results=False)
                        if dg_connection.start(options) is False:
                            print("[DevDraft] Failed to start Deepgram")
                            await websocket.send_json({"type": "error", "message": "Deepgram Start Failed"})
                        else:
                            deepgram_active = True
                            print("[DevDraft] Deepgram Started - Listening for requirements...")

                    elif command == "stop_capture":
                        print("[DevDraft] Stopping capture session...")
                        if dg_connection:
                            dg_connection.finish()
                            dg_connection = None
                        deepgram_active = False
                
                except json.JSONDecodeError as e:
                    print(f"[DevDraft] JSON Decode Error: {e}")
                except Exception as e:
                    print(f"[DevDraft] Error processing text message: {e}")

            # --- 2. Audio Data (Bytes) ---
            elif "bytes" in message:
                 if deepgram_active and dg_connection:
                     dg_connection.send(message["bytes"])
                 else:
                     print("[DevDraft] Received bytes but Deepgram not active")
            
            # --- 3. Trigger & Analysis Check ---
            # Trigger at 30 words for more responsive updates
            if deepgram_active:
                current_buffer_text = " ".join(trigger_buffer)
                word_count = len(current_buffer_text.split())
                
                # Send word count progress to frontend
                await websocket.send_json({"type": "word_count", "count": word_count, "target": 30})
                
                if word_count >= 30:
                    print(f"[DevDraft] Trigger reached ({word_count} words). Extracting requirements...")
                    
                    # Analyze with previous spec for incremental updates
                    analysis_result = await analyze_transcript(
                        current_text=" ".join(trigger_buffer),
                        full_history=full_history,
                        previous_spec=current_spec
                    )
                    
                    if analysis_result:
                        current_spec = analysis_result
                        await websocket.send_json({"type": "project_spec", "data": analysis_result})
                    
                    trigger_buffer = []

    except WebSocketDisconnect:
        print("[DevDraft] Client disconnected")
    except Exception as e:
        print(f"[DevDraft] Error in websocket loop: {e}")
    finally:
        if dg_connection:
            dg_connection.finish()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
