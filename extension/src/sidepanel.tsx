import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import AudioVisualizer from './components/AudioVisualizer'
import type { ProjectSpec, AgenticTool } from './utils/promptGenerator'
import {
    generateSuperPrompt,
    copyToClipboardAndRedirect,
    downloadPromptAsFile,
    getAvailableTools
} from './utils/promptGenerator'
import CodePreview from './components/CodePreview'
import type { GeneratedFile } from './utils/zipGenerator'

// --- LEGACY COMPONENTS REMOVED FOR ONYX VOID ---

const SidePanel = () => {
    const [status, setStatus] = useState<'Disconnected' | 'Connected' | 'Error' | 'Recording'>('Disconnected');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [_fullTranscript, setFullTranscript] = useState<string>('');

    // DevDraft AI State
    const [projectSpec, setProjectSpec] = useState<ProjectSpec | null>(null);
    const [newRequirementIds, setNewRequirementIds] = useState<Set<number>>(new Set());
    const [selectedTool, setSelectedTool] = useState<AgenticTool>('lovable');
    const [buildStatus, setBuildStatus] = useState<string>('');

    // Code Generation State
    const [generatedCode, setGeneratedCode] = useState<{
        projectName: string;
        files: GeneratedFile[];
        description: string;
        setupCommands: string[];
    } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Progress Logic
    // Progress Logic (Simplified for Onyx Void)
    const [_, setWordCountProgress] = useState(0); // Kept for set compatibility
    // const TARGET_WORD_COUNT = 30; // Unused in new UI
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const previousSpecRef = useRef<ProjectSpec | null>(null);

    // Track new requirements for pulse animation
    useEffect(() => {
        if (projectSpec && previousSpecRef.current) {
            const prevIds = new Set(previousSpecRef.current.requirements.map(r => r.id));
            const newIds = projectSpec.requirements
                .filter(r => !prevIds.has(r.id))
                .map(r => r.id);

            if (newIds.length > 0) {
                setNewRequirementIds(new Set(newIds));
                // Clear "new" status after animation
                setTimeout(() => setNewRequirementIds(new Set()), 1000);
            }
        }
        previousSpecRef.current = projectSpec;
    }, [projectSpec]);

    const connectToBackend = (): Promise<WebSocket> => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket('wss://devdraft-backend-111310202200.us-central1.run.app/ws');

            ws.onopen = () => {
                console.log("[DevDraft] WebSocket connected");
                socketRef.current = ws;
                resolve(ws);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'transcript') {
                        setTranscript(prev => (prev + ' ' + message.data).slice(-300));
                        setFullTranscript(prev => prev + ' ' + message.data);
                    }
                    else if (message.type === 'word_count') {
                        setWordCountProgress(message.count);
                    }
                    else if (message.type === 'project_spec') {
                        console.log("[DevDraft] Received project spec:", message.data);
                        setProjectSpec(message.data);
                        setWordCountProgress(0);
                    }
                } catch (e) {
                    console.error("[DevDraft] Parse error:", e);
                }
            };

            ws.onerror = (err) => {
                console.error("[DevDraft] WebSocket error:", err);
                if (status === 'Disconnected') {
                    setStatus('Error');
                    reject(err);
                }
            };

            ws.onclose = () => {
                console.log("[DevDraft] WebSocket closed");
                socketRef.current = null;
                setStatus('Disconnected');
            };
        });
    };

    const startCapture = async () => {
        try {
            setStatus('Connected');

            const capturedStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false }
            });

            const audioTracks = capturedStream.getAudioTracks();
            if (audioTracks.length === 0) {
                alert("Please check 'Share Audio' in the permission dialog.");
                capturedStream.getTracks().forEach(track => track.stop());
                setStatus('Disconnected');
                return;
            }

            let ws = socketRef.current;
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                ws = await connectToBackend();
            }

            console.log("[DevDraft] Sending start_capture command...");
            ws.send(JSON.stringify({ type: 'start_capture' }));

            setStream(capturedStream);
            setFullTranscript('');
            setTranscript('');
            setWordCountProgress(0);
            setProjectSpec(null);
            setBuildStatus('');

            const audioStream = new MediaStream(audioTracks);
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(event.data);
                }
            };

            mediaRecorder.start(1000);
            setStatus('Recording');
            capturedStream.getVideoTracks()[0].onended = () => stopCapture();
        } catch (err: any) {
            console.error("[DevDraft]", err);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
            if (socketRef.current) socketRef.current.close();
            setStatus('Error');
        }
    };

    const stopCapture = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log("[DevDraft] Sending stop_capture command...");
            socketRef.current.send(JSON.stringify({ type: 'stop_capture' }));
        }
        setStatus('Disconnected');
    };

    const handleBuildProject = async () => {
        if (!projectSpec) return;

        const specWithTranscript = { ...projectSpec, raw_transcript_snapshot: _fullTranscript };
        const prompt = generateSuperPrompt(specWithTranscript);
        const result = await copyToClipboardAndRedirect(prompt, selectedTool);
        setBuildStatus(result.message);

        setTimeout(() => setBuildStatus(''), 3000);
    };

    const handleDownload = () => {
        if (!projectSpec) return;
        const specWithTranscript = { ...projectSpec, raw_transcript_snapshot: _fullTranscript };
        downloadPromptAsFile(specWithTranscript);
    };

    const handleGenerateCode = async () => {
        if (!projectSpec) return;

        setIsGenerating(true);
        setBuildStatus('Generating code with AI...');

        try {
            const response = await fetch('https://devdraft-backend-111310202200.us-central1.run.app/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_spec: projectSpec })
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Process all complete lines
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const message = JSON.parse(line);

                        // Handle Status Updates
                        if (message.status === 'planning') {
                            setBuildStatus('🧠 Architecting Solution...');
                        }
                        else if (message.status === 'planning_complete') {
                            setBuildStatus('📝 Blueprint Created!');
                        }
                        else if (message.status === 'building') {
                            setBuildStatus('🔨 Building Code Modules...');
                        }
                        // Handle Completion
                        else if (message.status === 'complete' || message.success) {
                            if (message.success && message.files?.length > 0) {
                                setGeneratedCode({
                                    projectName: message.project_name,
                                    files: message.files,
                                    description: message.description,
                                    setupCommands: message.setup_commands
                                });
                                setBuildStatus('');
                            } else {
                                setBuildStatus(`Error: ${message.error || 'No code generated'}`);
                            }
                        }
                        // Handle Error
                        else if (message.status === 'error') {
                            setBuildStatus(`Error: ${message.error}`);
                        }
                    } catch (e) {
                        console.error("Error parsing stream:", e);
                    }
                }
            }
        } catch (error) {
            console.error('[DevDraft] Generation error:', error);
            setBuildStatus('Failed to generate code. Is the backend running?');
            setTimeout(() => setBuildStatus(''), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    // Onyx Void: Only showing active requirements in the main log
    const activeRequirements = projectSpec?.requirements.filter(r => r.status === 'active') || [];

    // --- RENDER UNCHANGED LOGIC ABOVE ---

    // --- ONYX VOID RENDER ---
    return (
        <div style={{
            height: '100vh',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        }}>
            {/* 1. Dynamic Header */}
            <div className="header-container animate-enter" style={{ animationDelay: '0ms' }}>
                <div className="brand-text">
                    <span style={{ color: 'var(--hyper-purple)' }}>◆</span>
                    DEVDRAFT
                </div>
                <div className={`status-pill ${status === 'Recording' ? 'recording' : ''}`}>
                    <div className="status-dot" />
                    <span>{status === 'Recording' ? 'LISTENING' : status.toUpperCase()}</span>
                </div>
            </div>

            {/* 2. Void Visualizer (Always present but active only when recording) */}
            <div className="void-visualizer animate-enter" style={{ animationDelay: '100ms' }}>
                <AudioVisualizer stream={stream} isActive={status === 'Recording'} />
            </div>

            {/* 3. Main Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', display: 'flex', flexDirection: 'column' }}>

                {/* Empty State */}
                {!projectSpec && !transcript && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>// AWAITING INPUT</div>
                        <div style={{ width: '40px', height: '1px', background: 'var(--text-tertiary)' }} />
                    </div>
                )}

                {/* Project Summary Shard */}
                {projectSpec?.project_summary && (
                    <div className="data-shard shard-northstar animate-enter">
                        <div className="shard-label">OBJECTIVE</div>
                        <div className="shard-content">{projectSpec.project_summary}</div>
                    </div>
                )}

                {/* Requirements Feed */}
                {activeRequirements.length > 0 && (
                    <div className="data-shard animate-enter" style={{ animationDelay: '200ms' }}>
                        <div className="shard-label">REQUIREMENTS_LOG [{activeRequirements.length}]</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeRequirements.map(req => (
                                <div key={req.id} className={`req-item ${newRequirementIds.has(req.id) ? 'new' : ''}`}>
                                    <div className="req-id">{String(req.id).padStart(2, '0')}</div>
                                    <div className="req-text">{req.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tech Stack (Inline) */}
                {projectSpec?.tech_stack && projectSpec.tech_stack.length > 0 && (
                    <div className="data-shard animate-enter" style={{ padding: '12px 16px' }}>
                        <div className="shard-label" style={{ marginBottom: '4px' }}>STACK_TRACE</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            {projectSpec.tech_stack.join('  //  ')}
                        </div>
                    </div>
                )}

                {/* Live Transcript Shard */}
                {transcript && (
                    <div className="data-shard animate-enter">
                        <div className="shard-label">LIVE_STREAM</div>
                        <div style={{
                            fontSize: '12px',
                            lineHeight: '1.5',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {transcript}
                            <span className="cursor-blink">_</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Action Deck */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-enter">

                {projectSpec && (
                    <>
                        {/* Generate Button */}
                        <button
                            className="btn-liquid"
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span>PROCESSING</span>
                                    <span style={{ fontSize: '10px', opacity: 0.7 }}>// {buildStatus || 'WAIT'}</span>
                                </>
                            ) : (
                                <>
                                    <span>GENERATE SYSTEM</span>
                                    <span style={{ opacity: 0.5 }}>→</span>
                                </>
                            )}
                        </button>

                        {buildStatus && !isGenerating && (
                            <div style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                textAlign: 'center',
                                color: buildStatus.includes('Error') ? 'var(--hyper-red)' : 'var(--hyper-green)'
                            }}>
                                {'>'} {buildStatus}
                            </div>
                        )}

                        {/* Secondary Actions Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button className="btn-ghost" onClick={handleBuildProject}>COPY PROMPT</button>
                            <button className="btn-ghost" onClick={handleDownload}>DOWNLOAD</button>
                        </div>

                        {/* Tool Selector */}
                        <select
                            className="select-minimal"
                            value={selectedTool}
                            onChange={(e) => setSelectedTool(e.target.value as AgenticTool)}
                        >
                            {getAvailableTools().map(tool => (
                                <option key={tool.value} value={tool.value}>TARGET: {tool.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </>
                )}

                {/* Record Control */}
                <button
                    className={`btn-liquid btn-record ${status === 'Recording' ? 'recording' : ''}`}
                    onClick={status === 'Recording' ? stopCapture : startCapture}
                    disabled={status === 'Connected' || status === 'Error'}
                    style={{ marginTop: projectSpec ? '8px' : '0' }}
                >
                    {status === 'Recording' ? 'TERMINATE SESSION' : 'INITIATE CAPTURE'}
                </button>
            </div>

            {/* Modal */}
            {generatedCode && (
                <CodePreview
                    projectName={generatedCode.projectName}
                    files={generatedCode.files}
                    description={generatedCode.description}
                    setupCommands={generatedCode.setupCommands}
                    onClose={() => setGeneratedCode(null)}
                />
            )}
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SidePanel />
    </React.StrictMode>,
)
