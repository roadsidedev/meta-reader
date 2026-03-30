import { useEffect, useRef, useCallback, useState } from 'react';
import { ParticleSystemRenderer } from '@/lib/canvasRenderer';
import { useResizeObserver, useWindowResize } from '@/hooks/useResizeObserver';
import { useSceneStore } from '@/stores/sceneStore';
import { useEffectStore } from '@/stores/effectStore';
import { useNarrationStore } from '@/stores/narrationStore';

interface OverlayCanvasProps {
  className?: string;
}

/**
 * OverlayCanvas component renders particle effects and sticky visual elements.
 */
export default function OverlayCanvas({ className = '' }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ParticleSystemRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastEmitTimeRef = useRef<number>(0);

  const [audioLevel, setAudioLevel] = useState(0);

  const { particleType, intensity } = useSceneStore();
  const { visualsEnabled, particlesEnabled, maxParticles, effectIntensity } = useEffectStore();
  const { isPlaying } = useNarrationStore();

  // Initialize renderer and audio analysis
  useEffect(() => {
    if (!canvasRef.current) return;

    rendererRef.current = new ParticleSystemRenderer(canvasRef.current, maxParticles);

    // Try to setup audio analysis
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current && !analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
    } catch (error) {
      console.warn('Audio analysis not available:', error);
    }
  }, [maxParticles]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    rendererRef.current.resize(width, height);
  }, []);

  useResizeObserver(containerRef, () => handleResize());
  useWindowResize(handleResize, 200);

  // Render loop with particle updates
  useEffect(() => {
    if (!rendererRef.current || !visualsEnabled || !particlesEnabled) return;

    let lastTime = Date.now();
    let emitCounter = 0;

    const render = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Get audio level
      let currentAudioLevel = audioLevel;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        currentAudioLevel = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
      }

      setAudioLevel(currentAudioLevel);

      // Emit particles based on intensity and audio
      if (isPlaying && particleType !== 'none') {
        const emitRate = Math.floor(effectIntensity * intensity * 10 * (1 + currentAudioLevel));
        emitCounter += emitRate * deltaTime;

        if (emitCounter >= 1) {
          rendererRef.current?.emit(particleType, Math.floor(emitCounter), currentAudioLevel);
          emitCounter = 0;
        }
      }

      // Update and draw particles
      rendererRef.current?.update(deltaTime, currentAudioLevel);
      rendererRef.current?.draw();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualsEnabled, particlesEnabled, particleType, intensity, effectIntensity, isPlaying, audioLevel]);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          display: 'block',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}
