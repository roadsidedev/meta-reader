# StoryStage Architecture Overview

## High-Level Layers

The StoryStage application is organized into six interconnected layers that work together to deliver a performative audiobook experience:

**1. Data Layer** – EPUB parsing using `epubjs`, chapter text storage, and metadata extraction.

**2. State Layer** – Zustand stores managing narration state, scene generation, effects, and device responsiveness.

**3. Audio Layer** – Howler.js or Web Audio API combined with SpeechSynthesis for narration playback and real-time boundary events.

**4. AI Layer** – Hybrid approach using `@xenova/transformers` for local mood/keyword analysis and cloud APIs (Claude/GPT-4o) for comprehensive scene prompts.

**5. Rendering Layer (Core – Pretext powered)** – Three synchronized HTML5 Canvases in a relative container:
   - `sceneCanvas` (background visuals with procedural drawing or AI-generated imagery).  
   - `textCanvas` (Pretext-rendered narration text with theatrical styling).  
   - `overlayCanvas` (sticky effects including particles, lighting, vignettes).

**6. UI Layer** – React components with Framer Motion for smooth control animations and responsive theater mode interface.

## Data Flow

The core event loop drives the performative experience:

1. **Narration Boundary Event** – Audio playback triggers `onboundary` events as text chunks are spoken.
2. **AI Analysis** – Current chunk and story memory are sent to AI for scene analysis.
3. **Scene Update** – AI returns visual prompt, mood classification, particle instructions, and intensity.
4. **Canvas Rendering** – Background canvas updates with procedural or AI-generated visuals; overlay canvas adjusts particles based on audio amplitude and sentiment.
5. **Text Rendering** – Pretext `prepareWithSegments` + `layoutWithLines` processes the new chunk; text canvas draws with theatrical styling and highlighting.
6. **Sync** – All three canvases redraw in sync via `requestAnimationFrame`, maintaining <200ms latency.

## Responsive Strategy

Mobile-first responsiveness is achieved through a multi-layered approach:

**Container Sizing:** Wrap Canvases in a `div` with Tailwind responsive classes (`w-full max-w-[90vw] md:max-w-[70vw]`). Read `clientWidth` after layout to determine logical dimensions.

**Resize Handler (Critical for Mobile):** Use `useResizeObserver` + `window.addEventListener('resize', ...)` + `orientationchange` listeners. On every resize:
1. Update container dimensions from CSS.
2. Call `layoutWithLines(..., newWidth, lineHeight)` with new width.
3. Scale all Canvases: `canvas.width = container.clientWidth * devicePixelRatio`.
4. Redraw all three canvases.

**Breakpoints (Tailwind):** `sm` (mobile), `md` (tablet), `lg` (desktop). Portrait vs. Landscape: Adjust text width percentage (70% on mobile portrait, 50% on landscape). Touch-friendly: Larger hit areas, swipe gestures for chapter skip.

**High-DPI Scaling (Mobile Essential):**
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = containerWidth * dpr;
canvas.height = calculatedHeight * dpr;
ctx.scale(dpr, dpr); // Draw at logical coordinates
```

**Font & Line-Height Adaptation:** Mobile uses smaller base font (22–26px); Tablet/Desktop use larger (28–32px). Use CSS variables + Pretext font string updated on breakpoint change.

**Virtualization for Long Chapters:** Use `layoutNextLine` to render only visible spoken window + 1–2 buffer paragraphs. Pretext heights enable perfect `react-window` style virtualization.

## Performance Budget

- **Pretext hot path:** <0.1ms per layout (confirmed in benchmarks).  
- **Canvas redraw:** requestAnimationFrame throttled to 30fps on mobile when battery <20%.  
- **Particle count:** max 50 on mobile, 150 on desktop.  
- **AI latency:** Mitigate with local-first + caching; target <200ms total latency.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State Management | Zustand |
| Text Rendering | Pretext (@chenglou/pretext) |
| Audio | Web Audio API + SpeechSynthesis |
| EPUB Parsing | epubjs |
| AI (Local) | @xenova/transformers |
| AI (Cloud) | Claude/GPT-4o API |
| TTS | ElevenLabs API + Browser SpeechSynthesis |
| Animations | Framer Motion |
| PWA | Workbox |

## Directory Structure

```
story-stage/
├── client/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Theater.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── EpubUploader.tsx
│   │   │   ├── TheaterControls.tsx
│   │   │   ├── TextCanvas.tsx
│   │   │   ├── SceneCanvas.tsx
│   │   │   ├── OverlayCanvas.tsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── usePretext.ts
│   │   │   ├── useNarration.ts
│   │   │   ├── useAIScene.ts
│   │   │   └── useResizeObserver.ts
│   │   ├── stores/
│   │   │   ├── narrationStore.ts
│   │   │   ├── sceneStore.ts
│   │   │   ├── effectStore.ts
│   │   │   └── deviceStore.ts
│   │   ├── lib/
│   │   │   ├── epubParser.ts
│   │   │   ├── ttsEngine.ts
│   │   │   ├── aiAnalyzer.ts
│   │   │   ├── canvasRenderer.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── docs/
│   ├── PRETEXT_INTEGRATION.md
│   ├── AI_TTS_SCENE_ENGINE.md
│   ├── UI_COMPONENTS_AND_CONTROLS.md
│   └── PERFORMANCE_MOBILE_GUIDE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Key Design Decisions

**Canvas-First Rendering:** Three synchronized canvases provide full control over text styling, background visuals, and overlay effects without DOM reflows. This approach enables the <0.1ms Pretext layout performance and ensures smooth 60fps playback on mobile.

**Pretext for Text:** Pretext eliminates DOM-based text rendering, which would cause layout thrashing during real-time narration updates and responsive resizes. Canvas-native rendering ensures pixel-perfect typography and instant reflow on orientation changes.

**Hybrid AI:** Local transformers provide instant mood/keyword analysis for immediate visual feedback; cloud APIs generate comprehensive scene prompts for richer descriptions. This balances latency and quality.

**Zustand for State:** Lightweight state management keeps the app responsive and enables easy integration with Canvas rendering logic without unnecessary re-renders.

**PWA Support:** Offline capability allows users to cache EPUB files and pre-generated TTS audio, enabling reading sessions without internet connectivity.

## Testing Strategy

**Unit Tests:** Test Pretext layout calculations, AI prompt generation, and TTS chunking logic.

**Integration Tests:** Verify canvas rendering pipeline, state updates, and responsive resize behavior.

**E2E Tests:** Test full user flows: EPUB upload → voice selection → theater mode playback → chapter navigation.

**Performance Tests:** Benchmark Pretext layout time, canvas redraw FPS, and AI latency on target devices (iPhone 13, Android mid-range).

**Accessibility Tests:** Verify ARIA labels, keyboard navigation, high-contrast mode, and visuals toggle functionality.
