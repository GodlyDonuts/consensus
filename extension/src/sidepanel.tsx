import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import AudioVisualizer from './components/AudioVisualizer'
import type { ProjectSpec, Requirement, AgenticTool } from './utils/promptGenerator'
import {
    generateSuperPrompt,
    copyToClipboardAndRedirect,
    downloadPromptAsFile,
    getAvailableTools
} from './utils/promptGenerator'
import CodePreview from './components/CodePreview'
import type { GeneratedFile } from './utils/zipGenerator'

// Status Badge Component
const StatusIndicator = ({ status }: { status: string }) => {
    const isRecording = status === 'Recording';
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: '20px'
        }}>
            <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: isRecording ? 'var(--tint-success)' : 'var(--text-tertiary)',
                boxShadow: isRecording ? '0 0 8px var(--tint-success)' : 'none',
                transition: 'all 0.3s'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {status === 'Recording' ? 'Listening' : status}
            </span>
        </div>
    )
}

// Project North Star Component
const NorthStar = ({ summary }: { summary: string }) => (
    <div className="north-star animate-enter">
        <div className="north-star-label">🎯 Project North Star</div>
        <div className="north-star-summary">{summary}</div>
    </div>
)

// Requirement Item Component
const RequirementItem = ({ requirement, isNew }: { requirement: Requirement; isNew: boolean }) => {
    const isSuperseded = requirement.status === 'superseded';

    return (
        <div className={`requirement-item ${isNew ? 'new' : ''} ${isSuperseded ? 'superseded' : ''}`}>
            <div className="requirement-id">{requirement.id}</div>
            <div className="requirement-content">
                <div className="requirement-text">{requirement.description}</div>
                <span className={`requirement-badge ${requirement.status}`}>
                    {requirement.status === 'active' ? '✓ Active' : '✗ Changed'}
                    {requirement.supersedes && ` (replaced #${requirement.supersedes})`}
                </span>
            </div>
        </div>
    )
}

// Tech Stack Display
const TechStackDisplay = ({ techStack }: { techStack: string[] }) => (
    <div className="tech-stack">
        {techStack.map((tech, i) => (
            <span key={i} className="tech-pill">{tech}</span>
        ))}
    </div>
)

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
    const [wordCountProgress, setWordCountProgress] = useState(0);
    const TARGET_WORD_COUNT = 30;
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

    const activeRequirements = projectSpec?.requirements.filter(r => r.status === 'active') || [];
    const supersededRequirements = projectSpec?.requirements.filter(r => r.status === 'superseded') || [];

    return (
        <div style={{
            height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column',
            gap: '16px', boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🚀</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}>DevDraft AI</span>
                </div>
                <StatusIndicator status={status} />
            </div>

            {/* Main Panel */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Visualizer Section */}
                <div style={{
                    height: '100px',
                    background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid var(--material-border)',
                    flexShrink: 0
                }}>
                    <AudioVisualizer stream={stream} isActive={status === 'Recording'} />
                    {status === 'Recording' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                            Extracting requirements... {wordCountProgress} / {TARGET_WORD_COUNT} words
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Empty State */}
                    {!projectSpec && !transcript && (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎤</div>
                            <div className="empty-state-text">
                                Start a capture to listen to your client meeting and extract project requirements
                            </div>
                        </div>
                    )}

                    {/* Project North Star */}
                    {projectSpec?.project_summary && (
                        <NorthStar summary={projectSpec.project_summary} />
                    )}

                    {/* Tech Stack */}
                    {projectSpec?.tech_stack && projectSpec.tech_stack.length > 0 && (
                        <div className="animate-enter">
                            <div className="text-tiny" style={{ marginBottom: '8px' }}>TECH STACK</div>
                            <TechStackDisplay techStack={projectSpec.tech_stack} />
                        </div>
                    )}

                    {/* Active Requirements */}
                    {activeRequirements.length > 0 && (
                        <div className="animate-enter">
                            <div className="text-tiny" style={{ marginBottom: '10px' }}>
                                REQUIREMENTS ({activeRequirements.length})
                            </div>
                            {activeRequirements.map(req => (
                                <RequirementItem
                                    key={req.id}
                                    requirement={req}
                                    isNew={newRequirementIds.has(req.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Superseded Requirements (Collapsed) */}
                    {supersededRequirements.length > 0 && (
                        <details style={{ opacity: 0.7 }}>
                            <summary style={{
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                cursor: 'pointer',
                                marginBottom: '8px'
                            }}>
                                {supersededRequirements.length} changed requirement{supersededRequirements.length > 1 ? 's' : ''}
                            </summary>
                            {supersededRequirements.map(req => (
                                <RequirementItem
                                    key={req.id}
                                    requirement={req}
                                    isNew={false}
                                />
                            ))}
                        </details>
                    )}

                    {/* Live Transcript */}
                    {transcript && (
                        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--material-border)' }}>
                            <div className="text-tiny" style={{ marginBottom: '6px' }}>LIVE TRANSCRIPT</div>
                            <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--text-tertiary)' }}>
                                {transcript}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Build Actions */}
            {projectSpec && (
                <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Generate Code Button - Primary CTA */}
                    <button
                        className="btn-ios btn-build"
                        onClick={handleGenerateCode}
                        disabled={isGenerating}
                        style={{ opacity: isGenerating ? 0.7 : 1 }}
                    >
                        <span>{isGenerating ? '⏳' : '🔨'}</span>
                        <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
                    </button>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '11px',
                        color: 'var(--text-tertiary)'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--material-border)' }} />
                        <span>or export to</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--material-border)' }} />
                    </div>

                    {/* Tool Selector */}
                    <select
                        className="tool-selector"
                        value={selectedTool}
                        onChange={(e) => setSelectedTool(e.target.value as AgenticTool)}
                    >
                        {getAvailableTools().map(tool => (
                            <option key={tool.value} value={tool.value}>{tool.label}</option>
                        ))}
                    </select>

                    {/* Export Prompt Button */}
                    <button
                        className="btn-ios"
                        onClick={handleBuildProject}
                        style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}
                    >
                        <span>📋</span>
                        <span>Copy Prompt & Open</span>
                    </button>

                    {buildStatus && (
                        <div style={{
                            fontSize: '12px',
                            color: buildStatus.includes('Error') ? 'var(--tint-danger)' : 'var(--tint-success)',
                            textAlign: 'center'
                        }}>
                            {buildStatus}
                        </div>
                    )}
                </div>
            )}

            {/* Code Preview Modal */}
            {generatedCode && (
                <CodePreview
                    projectName={generatedCode.projectName}
                    files={generatedCode.files}
                    description={generatedCode.description}
                    setupCommands={generatedCode.setupCommands}
                    onClose={() => setGeneratedCode(null)}
                />
            )}

            {/* Footer Actions */}
            <div style={{ flexShrink: 0, display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    {status !== 'Recording' ? (
                        <button className="btn-ios" onClick={startCapture} disabled={status === 'Connected' || status === 'Error'}>
                            Start Capture
                        </button>
                    ) : (
                        <button className="btn-ios destructive" onClick={stopCapture}>
                            End Session
                        </button>
                    )}
                </div>

                {/* Download Button */}
                {projectSpec && (
                    <button
                        className="btn-ios"
                        onClick={handleDownload}
                        style={{
                            width: '48px',
                            padding: 0,
                            background: 'rgba(255,255,255,0.1)',
                            flex: 'none',
                            boxShadow: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Download Spec"
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SidePanel />
    </React.StrictMode>,
)
