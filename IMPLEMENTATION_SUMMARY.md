# StoryStage Implementation Summary

## Project Overview

**StoryStage** is a performative audiobook reader that transforms any EPUB file into an immersive, multi-sensory reading experience. The application combines synchronized text narration, AI-generated visual scenes, dynamic particle effects, and theatrical controls to create a unique way to experience literature.

**Repository:** [molty-miles/audio-pretext](https://github.com/molty-miles/audio-pretext)

---

## Architecture & Technology Stack

### Frontend Framework
- **React 19** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **Tailwind CSS 4** with OKLCH color system for responsive design
- **shadcn/ui** components for consistent UI patterns

### Core Libraries
- **Pretext** (`@chenglou/pretext`) – Canvas-based text rendering with perfect typography
- **Zustand** – Lightweight state management for narration, scenes, effects, and device state
- **Framer Motion** – Smooth animations and transitions
- **Lucide React** – Consistent icon system

### Canvas & Graphics
- **HTML5 Canvas API** – Custom renderers for backgrounds, text, and particles
- **Procedural Generation** – Mood-based scene rendering with dynamic effects

### TTS & Audio
- **Web Speech API** – Browser-native text-to-speech with boundary events
- **ElevenLabs API** – Optional premium voice synthesis (integration ready)
- **Web Audio API** – Audio analysis for particle reactivity

### AI & Analysis
- **Local Analyzer** – Keyword-based mood classification (instant, offline)
- **Claude API** – Optional cloud-based scene analysis for sophisticated prompts
- **Hybrid Approach** – Local-first with optional cloud enhancement

### PWA & Offline
- **Service Worker** – Network-first caching strategy
- **Web Manifest** – Installable app configuration
- **localStorage** – Persistent bookmark and preference storage

---

## Project Structure

```
audio-pretext/
├── client/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   ├── sw.js                  # Service worker
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── TextCanvas.tsx     # Pretext text rendering
│   │   │   ├── SceneCanvas.tsx    # Procedural background
│   │   │   ├── OverlayCanvas.tsx  # Particle effects
│   │   │   ├── EpubUploader.tsx   # File upload
│   │   │   ├── BookmarksPanel.tsx # Bookmark management
│   │   │   ├── SettingsPanel.tsx  # Theater controls
│   │   │   ├── ProgressBar.tsx    # Reading progress
│   │   │   └── [ui/]              # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useNarration.ts    # TTS playback control
│   │   │   ├── usePretext.ts      # Text rendering
│   │   │   ├── useAIScene.ts      # Scene analysis
│   │   │   ├── usePWA.ts          # App installation
│   │   │   └── useResizeObserver.ts
│   │   ├── lib/
│   │   │   ├── epubParser.ts      # EPUB extraction
│   │   │   ├── ttsEngine.ts       # TTS abstraction
│   │   │   ├── aiAnalyzer.ts      # Scene analysis
│   │   │   ├── canvasRenderer.ts  # Graphics rendering
│   │   │   └── bookmarkManager.ts # Bookmark persistence
│   │   ├── stores/
│   │   │   ├── narrationStore.ts  # Playback state
│   │   │   ├── sceneStore.ts      # Visual state
│   │   │   ├── effectStore.ts     # Effect settings
│   │   │   └── deviceStore.ts     # Responsive state
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Upload & chapter selection
│   │   │   ├── Theater.tsx        # Main experience
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx                # Routing
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Global styles
│   └── index.html
├── server/
│   └── index.ts                   # Static server
├── package.json
├── tsconfig.json
├── vite.config.ts
└── [documentation files]
```

---

## Core Features Implemented

### 1. EPUB Import & Parsing
- **Drag-and-drop upload** with file validation
- **Full EPUB 2/3 support** via JSZip + XML parsing
- **Automatic chapter extraction** with title detection
- **Table of contents** generation from manifest
- **Metadata extraction** (author, title, genre, language)
- **Genre-based mood classification** for initial scene setup

### 2. Narration Engine
- **Browser TTS** with Web Speech API
  - Multiple voice selection
  - Real-time boundary events for text sync
  - Speed control (0.5x - 2.0x)
  - Pause/resume/stop controls

- **ElevenLabs Integration** (optional)
  - Premium voice synthesis
  - API-based streaming
  - Higher quality output

- **Text Synchronization**
  - Character-level boundary events
  - Real-time highlighting
  - Smooth text-to-speech alignment

### 3. Pretext Text Rendering
- **Canvas-based typography** with perfect metrics
- **Responsive reflow** on window resize
- **Line highlighting** synchronized with narration
- **Theatrical styling** with shadows and effects
- **Portrait/landscape** orientation support
- **Mobile-optimized** rendering

### 4. AI Scene Intelligence
- **Local Mood Analysis**
  - Keyword-based classification
  - 6 mood categories: fantasy, noir, intimate, mysterious, action, peaceful
  - Instant offline processing

- **Scene Prompt Generation**
  - Mood-specific visual descriptions
  - Story context integration
  - Character and location memory

- **Optional Cloud Enhancement**
  - Claude API integration
  - Sophisticated narrative analysis
  - Fallback to local if unavailable

### 5. Visual Engine
- **Procedural Background Rendering**
  - Mood-specific aesthetics
  - Dynamic gradients and effects
  - Parallax layers for depth
  - Vignette and glow effects

- **Particle System**
  - 5 particle types: embers, rain, fog, leaves, dust
  - Audio-reactive intensity
  - Performance-optimized rendering
  - Configurable emission rates

- **Canvas Layers**
  - Background scene (SceneCanvas)
  - Foreground text (TextCanvas)
  - Overlay effects (OverlayCanvas)
  - Proper z-ordering and compositing

### 6. Theater Mode UI
- **Auto-hiding Controls**
  - 5-second fade on playback
  - Mouse movement reveals
  - Click to toggle visibility

- **Playback Controls**
  - Play/pause button
  - Speed adjustment (0.5x - 2.0x)
  - Effect intensity slider
  - Progress bar with time estimation

- **Bookmarks System**
  - Save reading positions
  - Add custom labels and notes
  - Edit and delete bookmarks
  - localStorage persistence
  - Export/import functionality

- **Settings Panel**
  - Playback speed control
  - Scene intensity adjustment
  - Effect intensity slider
  - Visual/particle toggles
  - Theme selection (epic, intimate, minimal)

- **Theme System**
  - Epic: Full visual effects
  - Intimate: Reduced effects, focus on text
  - Minimal: Text-only, no effects

### 7. Responsive Design
- **Mobile-First Approach**
  - Portrait/landscape detection
  - Touch-friendly controls
  - Adaptive text sizing
  - Breakpoint-aware layouts

- **Device Tracking**
  - Screen dimensions
  - Orientation changes
  - Breakpoint classification
  - DPI-aware rendering

### 8. PWA Support
- **Service Worker**
  - Network-first caching
  - Offline fallback
  - Asset caching
  - Update management

- **Web Manifest**
  - App installation
  - Custom icons
  - Standalone mode
  - Shortcuts

- **Installation Prompt**
  - Installable detection
  - User-triggered install
  - App state tracking

---

## State Management (Zustand)

### Narration Store
```typescript
- chapters: Chapter[]
- currentChapterIndex: number
- currentChunk: string
- currentCharIndex: number
- isPlaying: boolean
- playbackSpeed: number
- selectedVoiceId: string
```

### Scene Store
```typescript
- mood: Mood (fantasy | noir | intimate | mysterious | action | peaceful)
- visualPrompt: string
- particleType: ParticleType
- intensity: number
- colorPalette: string[]
- storyMemory: { characters, location, tone }
```

### Effect Store
```typescript
- theme: 'epic' | 'intimate' | 'minimal'
- effectIntensity: number
- visualsEnabled: boolean
- particlesEnabled: boolean
- textColor: string
- accentColor: string
```

### Device Store
```typescript
- breakpoint: 'mobile' | 'tablet' | 'desktop'
- orientation: 'portrait' | 'landscape'
- screenWidth: number
- screenHeight: number
```

---

## Key Algorithms & Implementations

### Mood Classification
```typescript
// Keyword-based scoring
1. Tokenize text to lowercase
2. Count keyword matches for each mood
3. Return mood with highest score
4. Fallback to 'peaceful' if no matches
```

### Text Synchronization
```typescript
// Boundary event handling
1. TTS engine emits boundary events with character index
2. Store current character index in narration store
3. TextCanvas queries line at character index
4. Highlight current line with accent color
5. Smooth transition between lines
```

### Particle Emission
```typescript
// Audio-reactive particle system
1. Analyze audio frequency data
2. Calculate average audio level (0-1)
3. Emit particles based on: intensity × effectIntensity × audioLevel
4. Update particle positions each frame
5. Remove particles when life expires
```

### Responsive Canvas Rendering
```typescript
// DPI-aware rendering
1. Get device pixel ratio
2. Set canvas.width = clientWidth × dpr
3. Scale context by dpr
4. Render at logical coordinates
5. Result: crisp rendering on all devices
```

---

## Performance Optimizations

### Canvas Rendering
- **Requestanimationframe** for smooth 60fps
- **Particle culling** - remove off-screen particles
- **Max particle limit** - configurable cap
- **DPI scaling** - efficient high-DPI rendering

### Text Rendering
- **Pretext caching** - reuse prepared text
- **Debounced reflow** - 200ms resize debounce
- **ResizeObserver** - efficient resize detection
- **Canvas clipping** - only render visible area

### State Management
- **Zustand subscriptions** - granular updates
- **Memoized selectors** - prevent unnecessary renders
- **useCallback** - stable function references

### Network
- **Service Worker caching** - offline support
- **Lazy loading** - code-split routes
- **Asset optimization** - gzip compression

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Speech API | ✅ | ✅ | ✅ | ✅ |
| Canvas API | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| ResizeObserver | ✅ | ✅ | ✅ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ | ✅ |

---

## Testing Checklist

- [x] EPUB upload and parsing
- [x] Chapter extraction and navigation
- [x] Text-to-speech playback
- [x] Boundary event synchronization
- [x] Text highlighting
- [x] Mood classification
- [x] Scene rendering
- [x] Particle effects
- [x] Responsive layout
- [x] Bookmark creation/deletion
- [x] Settings persistence
- [x] PWA installation
- [x] Offline functionality
- [x] Mobile responsiveness

---

## Future Enhancements

### Short Term
- [ ] Keyboard shortcuts (spacebar play/pause, arrow keys navigate)
- [ ] Chapter thumbnails in selection
- [ ] Reading time estimates
- [ ] Playback history

### Medium Term
- [ ] Multi-language support
- [ ] Custom voice synthesis
- [ ] Advanced scene customization
- [ ] Social sharing features
- [ ] Reading statistics

### Long Term
- [ ] Backend sync (cloud bookmarks)
- [ ] Community scene sharing
- [ ] Advanced AI scene generation
- [ ] Video background support
- [ ] Multiplayer reading sessions

---

## Build & Deployment

### Development
```bash
cd audio-pretext
pnpm install
pnpm dev
```

### Production Build
```bash
pnpm build
pnpm preview
```

### Build Output
- **Main bundle:** ~1.0 MB (gzipped: ~305 KB)
- **CSS:** ~120 KB (gzipped: ~19 KB)
- **Total:** ~1.4 MB (gzipped: ~330 KB)

### Deployment
- Static hosting (Netlify, Vercel, GitHub Pages)
- Service Worker enabled for offline support
- HTTPS required for Service Worker

---

## Documentation Files

- **PRD.md** - Product requirements and feature specifications
- **ARCHITECTURE.md** - System design and data flow
- **PRETEXT_INTEGRATION.md** - Text rendering guide
- **AI_TTS_SCENE_ENGINE.md** - AI and TTS integration
- **UI_COMPONENTS_AND_CONTROLS.md** - Component specifications
- **PERFORMANCE_MOBILE_GUIDE.md** - Optimization strategies

---

## Contributing

The codebase follows these conventions:

- **TypeScript** for all source files
- **React Hooks** for component logic
- **Zustand** for state management
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/molty-miles/audio-pretext).

---

**Last Updated:** March 30, 2026
**Version:** 1.0.0
**Status:** Production Ready
