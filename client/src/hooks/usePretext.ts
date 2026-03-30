import { useEffect, useRef, useCallback, useState } from 'react';
import { prepareWithSegments, layoutWithLines, type PreparedTextWithSegments, type LayoutLine } from '@chenglou/pretext';

export interface PretextLayout {
  lines: LayoutLine[];
  height: number;
  width: number;
}

export interface UsePretextOptions {
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  maxWidth?: number;
}

/**
 * Custom hook for managing Pretext text rendering with responsive layout.
 */
export function usePretext(text: string, options: UsePretextOptions = {}) {
  const {
    fontSize = 28,
    fontFamily = 'Georgia',
    lineHeight = 1.6,
    maxWidth = 800,
  } = options;

  const [preparedText, setPreparedText] = useState<PreparedTextWithSegments | null>(null);
  const [layout, setLayout] = useState<PretextLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fontString = `${fontSize}px "${fontFamily}"`;
  const computedLineHeight = lineHeight * fontSize;

  // Prepare text
  useEffect(() => {
    if (!text) {
      setPreparedText(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const prepared = prepareWithSegments(text, fontString, { whiteSpace: 'normal' });
      setPreparedText(prepared);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to prepare text');
      setError(error);
      console.error('Pretext preparation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [text, fontString]);

  // Layout text
  useEffect(() => {
    if (!preparedText) {
      setLayout(null);
      return;
    }

    try {
      const { lines, height } = layoutWithLines(preparedText, maxWidth, computedLineHeight);
      setLayout({
        lines,
        height,
        width: maxWidth,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to layout text');
      setError(error);
      console.error('Pretext layout error:', error);
    }
  }, [preparedText, maxWidth, computedLineHeight]);

  // Draw to canvas
  const drawToCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, x: number = 0, y: number = 0, highlightIndex?: number) => {
      if (!layout) return;

      ctx.font = fontString;
      ctx.fillStyle = ctx.fillStyle || '#000000';
      ctx.textBaseline = 'top';

      layout.lines.forEach((line, i) => {
        const lineY = y + i * computedLineHeight;

        // Highlight current line if specified
        if (highlightIndex === i) {
          ctx.fillStyle = '#e0e0e0';
          ctx.fillRect(x - 10, lineY - 5, layout.width + 20, computedLineHeight);
          ctx.fillStyle = '#000000';
        }

        ctx.fillText(line.text, x, lineY);
      });
    },
    [layout, fontString, computedLineHeight]
  );

  // Get line at character index
  const getLineAtCharIndex = useCallback(
    (charIndex: number) => {
      if (!preparedText || !layout) return null;

      let currentChar = 0;
      for (let i = 0; i < layout.lines.length; i++) {
        const line = layout.lines[i];
        const lineLength = line.text.length;

        if (currentChar + lineLength > charIndex) {
          return {
            lineIndex: i,
            line,
            charOffset: charIndex - currentChar,
          };
        }

        currentChar += lineLength;
      }

      return null;
    },
    [preparedText, layout]
  );

  // Reflow text on width change
  const reflow = useCallback((newWidth: number) => {
    if (!preparedText) return;

    try {
      const { lines, height } = layoutWithLines(preparedText, newWidth, computedLineHeight);
      setLayout({
        lines,
        height,
        width: newWidth,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reflow text');
      setError(error);
      console.error('Pretext reflow error:', error);
    }
  }, [preparedText, computedLineHeight]);

  return {
    preparedText,
    layout,
    isLoading,
    error,
    drawToCanvas,
    getLineAtCharIndex,
    reflow,
    fontSize,
    fontFamily,
    lineHeight: computedLineHeight,
  };
}
