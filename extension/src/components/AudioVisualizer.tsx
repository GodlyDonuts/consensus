import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        // Default state (straight line)
        if (!isActive || !stream) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 2048; // High resolution for smooth curves
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let phase = 0;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyzer.getByteTimeDomainData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // "Siri" Style Logic: Multiple overlapping sine waves modified by audio volume
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;

            // Calculate approximate volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += Math.abs(dataArray[i] - 128);
            }
            const volume = sum / bufferLength; // 0 to ~128
            const amplitude = Math.max(volume * 2, 2); // Minimum ripple

            ctx.lineWidth = 2;

            // Draw 3 waves with slight offsets
            [
                { color: 'rgba(10, 132, 255, 0.8)', speed: 0.1, offset: 0 },
                { color: 'rgba(94, 92, 230, 0.5)', speed: 0.07, offset: 20 },
                { color: 'rgba(48, 209, 88, 0.3)', speed: 0.05, offset: 40 }
            ].forEach(wave => {
                ctx.beginPath();
                ctx.strokeStyle = wave.color;

                for (let x = 0; x < width; x++) {
                    // Math for organic wave
                    const y = centerY +
                        Math.sin((x * 0.01) + phase * wave.speed + wave.offset) * (amplitude * Math.sin(x / width * Math.PI)); // Taper ends

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });

            phase += 1;
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            audioContext.close();
        };
    }, [stream, isActive]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={120}
            style={{ width: '100%', height: '80px', display: 'block' }}
        />
    );
};

export default AudioVisualizer;
