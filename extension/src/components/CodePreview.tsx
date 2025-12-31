import React, { useState } from 'react';
import type { GeneratedFile } from '../utils/zipGenerator';
import { downloadProjectAsZip, copyFileToClipboard } from '../utils/zipGenerator';

interface CodePreviewProps {
    projectName: string;
    files: GeneratedFile[];
    description: string;
    setupCommands: string[];
    onClose: () => void;
}

// Get language label for file type
const getLanguageLabel = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const labels: Record<string, string> = {
        'js': 'JavaScript',
        'jsx': 'React JSX',
        'ts': 'TypeScript',
        'tsx': 'React TSX',
        'css': 'CSS',
        'html': 'HTML',
        'json': 'JSON',
        'md': 'Markdown'
    };
    return labels[ext] || ext.toUpperCase();
};

const CodePreview: React.FC<CodePreviewProps> = ({
    projectName,
    files,
    description,
    setupCommands,
    onClose
}) => {
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const activeFile = files[activeFileIndex];

    const handleCopy = async (index: number) => {
        const success = await copyFileToClipboard(files[index].content);
        if (success) {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadProjectAsZip(projectName, files);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexShrink: 0
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                        📦 {projectName}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {description}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {isDownloading ? '⏳' : '⬇️'} Download ZIP
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* Setup Commands */}
            {setupCommands.length > 0 && (
                <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '12px',
                    flexShrink: 0
                }}>
                    <span style={{ fontSize: '11px', color: 'var(--tint-primary)', fontWeight: 600 }}>
                        Setup:
                    </span>
                    <code style={{ fontSize: '12px', marginLeft: '8px', color: 'var(--text-secondary)' }}>
                        {setupCommands.join(' && ')}
                    </code>
                </div>
            )}

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', gap: '12px', overflow: 'hidden' }}>
                {/* File List */}
                <div style={{
                    width: '200px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '8px',
                    overflowY: 'auto',
                    flexShrink: 0
                }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', padding: '4px 8px' }}>
                        Files ({files.length})
                    </div>
                    {files.map((file, index) => (
                        <div
                            key={file.path}
                            onClick={() => setActiveFileIndex(index)}
                            style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                background: index === activeFileIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                color: index === activeFileIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                                marginBottom: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <span style={{ opacity: 0.6 }}>📄</span>
                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}>
                                {file.path}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Code View */}
                <div style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* File Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0
                    }}>
                        <div>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{activeFile?.path}</span>
                            <span style={{
                                fontSize: '10px',
                                background: 'rgba(99, 102, 241, 0.2)',
                                color: 'var(--tint-secondary)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px'
                            }}>
                                {getLanguageLabel(activeFile?.path || '')}
                            </span>
                        </div>
                        <button
                            onClick={() => handleCopy(activeFileIndex)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            {copiedIndex === activeFileIndex ? '✓ Copied!' : '📋 Copy'}
                        </button>
                    </div>

                    {/* Code Content */}
                    <pre style={{
                        flex: 1,
                        margin: 0,
                        padding: '14px',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        fontFamily: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", monospace',
                        overflowY: 'auto',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {activeFile?.content || ''}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default CodePreview;
