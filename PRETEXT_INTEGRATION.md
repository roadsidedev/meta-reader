# Pretext Integration Guide (Mobile-First)

## Why Pretext?

Pretext is the cornerstone of StoryStage's text rendering strategy. It provides zero DOM reflows, enabling real-time narration updates and responsive resizes without layout thrashing. Canvas-first rendering gives full control over theatrical text styling, and proven cross-browser accuracy (Chrome/Safari/Firefox) ensures consistent rendering across all devices. Importantly, Pretext is fully supported on mobile—no special caveats. Layout is pure JavaScript, so `devicePixelRatio` + resize handling gives perfect scaling on any modern mobile browser with Canvas `measureText`.

## Installation & Setup

```bash
npm install @chenglou/pretext
```

## Core API for StoryStage

```typescript
import {
  prepareWithSegments,
  layoutWithLines,
  type PreparedTextWithSegments,
  type LayoutLine
} from '@chenglou/pretext';

// In component:
const [preparedText, setPreparedText] = useState<PreparedTextWithSegments | null>(null);

useEffect(() => {
  const prepared = prepareWithSegments(currentNarrationChunk, '28px "Georgia"', { whiteSpace: 'normal' });
  setPreparedText(prepared);
}, [currentNarrationChunk]);

// On render / resize:
const { lines, height } = layoutWithLines(preparedText!, currentContainerWidth, 1.6 * 28);

// Draw to Canvas:
ctx.clearRect(...);
lines.forEach((line: LayoutLine, i) => {
  ctx.fillText(line.text, xOffset, yOffset + i * lineHeight);
});
```

## Mobile & Responsive Adaptation

### 1. Container Sizing

Wrap Canvases in a `div` with Tailwind responsive classes: `w-full max-w-[90vw] md:max-w-[70vw]`. Read `clientWidth` after layout to determine the actual width available for text rendering.

### 2. Resize Handler (Critical for Mobile)

```typescript
const handleResize = useCallback(() => {
  const width = containerRef.current!.clientWidth * window.devicePixelRatio;
  // Re-layout Pretext with new width
  // Scale canvas.width/height accordingly
  // Redraw all three canvases
}, []);

useResizeObserver(containerRef, handleResize);

useEffect(() => {
  window.addEventListener('orientationchange', handleResize);
  return () => window.removeEventListener('orientationchange', handleResize);
}, []);
```

### 3. High-DPI Scaling (Mobile Essential)

```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = containerWidth * dpr;
canvas.height = calculatedHeight * dpr;
ctx.scale(dpr, dpr); // Draw at logical coordinates
```

### 4. Font & Line-Height Adaptation

Mobile uses smaller base font (22–26px); Tablet/Desktop use larger (28–32px). Implement CSS variables that update on breakpoint change, and pass the updated font string to Pretext.

### 5. Virtualization for Long Chapters

Use `layoutNextLine` to render only the visible spoken window + 1–2 buffer paragraphs. Pretext heights enable perfect `react-window` style virtualization, ensuring smooth performance even with multi-chapter books.

### 6. Testing Checklist

- iOS Safari (portrait/landscape).  
- Android Chrome.  
- Device rotation mid-narration.  
- Low-end device (ensure particles throttle).

## Caveats (from Pretext docs)

- Use named fonts (not `system-ui` on macOS).  
- Clear cache when switching fonts heavily.  
- All languages fully supported (CJK, RTL, emojis).

Pretext makes responsive performative text trivial — the rest of the app inherits this fluidity.
