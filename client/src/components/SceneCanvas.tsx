import { useEffect, useRef, useCallback } from 'react';
import { SceneCanvasRenderer } from '@/lib/canvasRenderer';
import { useResizeObserver, useWindowResize } from '@/hooks/useResizeObserver';
import { useSceneStore } from '@/stores/sceneStore';
import { useEffectStore } from '@/stores/effectStore';

interface SceneCanvasProps {
  className?: string;
}

/**
 * SceneCanvas component renders procedural background scenes based on mood.
 */
export default function SceneCanvas({ className = '' }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SceneCanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { mood, colorPalette, intensity } = useSceneStore();
  const { visualsEnabled } = useEffectStore();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    rendererRef.current = new SceneCanvasRenderer(canvasRef.current);
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    rendererRef.current.resize(width, height);
  }, []);

  useResizeObserver(containerRef, () => handleResize());
  useWindowResize(handleResize, 200);

  // Draw background
  useEffect(() => {
    if (!rendererRef.current || !visualsEnabled) return;

    const render = () => {
      rendererRef.current?.drawBackground(mood, colorPalette, intensity);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mood, colorPalette, intensity, visualsEnabled]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className}`}>
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
