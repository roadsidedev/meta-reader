# UI Components and Controls Reference

## Theater Mode Interface

The theater mode provides a cinematic, immersive interface optimized for mobile-first usage. Controls are minimalist and fade on inactivity, revealing the full canvas experience.

### Control Layout

**Mobile Portrait:** Controls stack vertically at the bottom with large touch targets (44px minimum). Text canvas occupies 60% of screen; scene canvas fills background.

**Mobile Landscape:** Controls dock to the right side; text canvas and scene canvas split horizontally with 50/50 width ratio.

**Tablet/Desktop:** Controls appear in a floating panel with opacity transitions. Full-screen theater mode with minimal chrome.

### Core Controls

| Control | Function | Default |
|---------|----------|---------|
| Play/Pause | Toggle narration playback | Play |
| Speed Control | Adjust playback speed (0.8x–1.5x) | 1.0x |
| Voice Selector | Choose TTS voice or audio track | First available |
| Effect Intensity | Slider for visual effects (0–100%) | 50% |
| Theme Selector | Choose preset themes (Epic, Intimate, Minimal) | Epic |
| Progress Bar | Navigate chapters and track playback position | Current position |
| Bookmarks | Save and jump to bookmarked positions | None |
| Visuals Toggle | Turn off background/overlay effects | On |
| Full-Screen | Enter/exit full-screen mode | Off |

### Control Component Structure

```typescript
interface TheaterControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  voices: Voice[];
  selectedVoice: Voice;
  onVoiceChange: (voice: Voice) => void;
  effectIntensity: number;
  onIntensityChange: (intensity: number) => void;
  theme: 'epic' | 'intimate' | 'minimal';
  onThemeChange: (theme: string) => void;
  progress: number;
  duration: number;
  onProgressChange: (progress: number) => void;
  chapters: Chapter[];
  onChapterSelect: (chapter: Chapter) => void;
  bookmarks: Bookmark[];
  onBookmarkAdd: (position: number) => void;
  onBookmarkJump: (bookmark: Bookmark) => void;
  visualsEnabled: boolean;
  onVisualsToggle: () => void;
  onFullScreen: () => void;
}
```

## Responsive Breakpoints

| Breakpoint | Width | Layout | Font Size |
|-----------|-------|--------|-----------|
| Mobile | <640px | Portrait stacked | 22px |
| Mobile Landscape | 640px–1024px | Horizontal split | 24px |
| Tablet | 1024px–1280px | Side-by-side | 26px |
| Desktop | >1280px | Full-screen with floating controls | 28px+ |

## Theme Presets

Each theme defines a complete visual style including colors, particle effects, and animation speeds.

### Epic Theme
- **Color Palette:** Deep purples, golds, dark blues
- **Particles:** Embers, sparks, magical glows
- **Animation Speed:** Fast, energetic
- **Text Style:** Large, bold, with glow effect
- **Background:** Rich gradients with parallax layers

### Intimate Theme
- **Color Palette:** Warm browns, soft golds, muted reds
- **Particles:** Gentle fog, floating dust
- **Animation Speed:** Slow, contemplative
- **Text Style:** Medium, elegant serif, soft shadow
- **Background:** Warm gradients, minimal movement

### Minimal Theme
- **Color Palette:** Monochrome, subtle grays
- **Particles:** None or very subtle
- **Animation Speed:** Static
- **Text Style:** Clean sans-serif, high contrast
- **Background:** Simple solid color or very subtle gradient

## Accessibility Features

**Keyboard Navigation:** All controls accessible via Tab, Enter, Space, and arrow keys.

**ARIA Labels:** All interactive elements have descriptive `aria-label` attributes.

**High-Contrast Mode:** Automatically activated based on system preferences; increases text contrast and removes subtle effects.

**Visuals Toggle:** Completely disables background and overlay canvases, leaving only Pretext text + audio.

**Screen Reader Support:** Narration progress, chapter titles, and bookmark descriptions announced via `aria-live` regions.

## Bookmarking & Annotations

Users can bookmark positions within chapters and add text annotations that appear as overlays on the scene canvas.

### Bookmark Data Structure

```typescript
interface Bookmark {
  id: string;
  chapterId: string;
  position: number; // Character index
  timestamp: number; // Unix timestamp
  label: string;
  notes?: string;
}
```

### Annotation Drawing

Annotations are drawn on the overlay canvas using a simple drawing interface:

```typescript
interface Annotation {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
  timestamp: number;
}
```

## Mobile-Specific Interactions

**Swipe Left/Right:** Skip to previous/next chapter.

**Tap to Show/Hide Controls:** Single tap reveals controls; tap again to hide.

**Long Press:** Open context menu for bookmarking or annotation.

**Pinch to Zoom:** Adjust text size (clamped between 18px and 36px).

**Orientation Change:** Automatically re-layout canvas and controls; Pretext re-flows text instantly.

## Performance Optimization

**Control Debouncing:** Slider changes debounced to 100ms to avoid excessive re-renders.

**Canvas Throttling:** Particle updates throttled to 30fps on low-battery devices.

**Lazy Loading:** Controls rendered off-screen and faded in on interaction.

**Memory Management:** Bookmark and annotation data stored in IndexedDB for persistence without blocking main thread.
