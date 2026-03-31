import { useEffect, useRef, useCallback, useMemo } from 'react';
import { usePretext } from '@/hooks/usePretext';
import { useResizeObserver, useWindowResize } from '@/hooks/useResizeObserver';
import { useNarrationStore } from '@/stores/narrationStore';
import { useEffectStore } from '@/stores/effectStore';

interface TextCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * TextCanvas component renders narration text using Pretext with theatrical styling.
 */
export default function TextCanvas({ width = 800, height = 600, className = '' }: TextCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { currentChunk, currentCharIndex } = useNarrationStore();
  const { textColor, accentColor } = useEffectStore();

  const fontSize = 28;
  const fontFamily = 'Georgia';
  const lineHeight = 1.6;

  const { layout, drawToCanvas, getLineAtCharIndex, reflow } = usePretext(currentChunk, {
    fontSize,
    fontFamily,
    lineHeight,
    maxWidth: width - 40, // Account for padding
  });

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const newWidth = containerRef.current.clientWidth;
    const newHeight = containerRef.current.clientHeight;

    canvasRef.current.width = newWidth * window.devicePixelRatio;
    canvasRef.current.height = newHeight * window.devicePixelRatio;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    reflow(newWidth - 40);
  }, [reflow]);

  useResizeObserver(containerRef, () => handleResize());
  useWindowResize(handleResize, 200);

  // Initial canvas setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();

    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Draw text
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvasW = canvasRef.current.width / window.devicePixelRatio;
    const canvasH = canvasRef.current.height / window.devicePixelRatio;

    // Clear canvas
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Fallback: render plain text when pretext layout is unavailable
    if (!layout) {
      if (currentChunk) {
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'transparent';
        // Word-wrap manually for the fallback path
        const words = currentChunk.split(' ');
        let line = '';
        let y = Math.max(20, (canvasH - fontSize * 3) / 2);
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > canvasW - 40 && line) {
            ctx.fillText(line, 20, y);
            line = word;
            y += fontSize * lineHeight;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, 20, y);
      }
      return;
    }

    // Set text style
    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';

    // Calculate vertical centering
    const totalHeight = layout.height;
    const canvasHeight = canvasRef.current.height / window.devicePixelRatio;
    const startY = Math.max(20, (canvasHeight - totalHeight) / 2);

    // Get highlighted line
    const highlightedLine = getLineAtCharIndex(currentCharIndex);

    // Draw lines
    layout.lines.forEach((line, i) => {
      const y = startY + i * (fontSize * lineHeight);

      // Draw highlight background for current line
      if (highlightedLine && highlightedLine.lineIndex === i) {
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(10, y - 5, layout.width - 20, fontSize * lineHeight);
        ctx.globalAlpha = 1;
        ctx.fillStyle = textColor;
      }

      // Draw text with soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(line.text, 20, y);

      // Clear shadow
      ctx.shadowColor = 'transparent';
    });
  }, [layout, currentChunk, currentCharIndex, textColor, accentColor, fontSize, fontFamily, lineHeight, getLineAtCharIndex]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-transparent ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        role="img"
        aria-label={currentChunk ? `Narration: ${currentChunk}` : 'Narration text canvas'}
        style={{
          display: 'block',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );
}
