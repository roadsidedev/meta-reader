# Product Requirements Document (PRD): Performative Audiobook Reader ("StoryStage")

## 1. Product Overview
**Product Name:** StoryStage  
**Version:** 1.0  
**Description:** A web-based performative audiobook experience that transforms any EPUB ebook into an immersive "mind-movie" theater. As narration audio plays (TTS or pre-recorded), the screen becomes a living stage:  
- Pretext-powered Canvas renders the currently spoken text with pixel-perfect typography and layout.  
- AI analyzes narration in real-time to generate adaptive background scenes and "sticky" visual effects that play out the story descriptively.  
- Effects are subtle, narrative-driven, and non-distracting — creating a cinematic layer that enhances immersion without interrupting reading flow.

**Core Value Proposition:**  
Turn passive listening into an active, visual storytelling experience. Users hear the voice, see the scene unfold, and follow highlighted text — all perfectly synced. Mobile-first design (80%+ of usage on phones/tablets).

**Target Users:**  
- Audiobook enthusiasts who want visual enhancement.  
- Readers with visual impairments or preference for multimodal consumption.  
- Fantasy/sci-fi/literary fiction fans seeking immersion.  
- Mobile & tablet users (primary).

**Key Differentiators:**  
- Pretext enables reflow-free, Canvas-native text that scales perfectly across devices.  
- Real-time AI scene intelligence (mood, characters, environment continuity).  
- Fully responsive: desktop, tablet, mobile with zero performance loss.

**Success Metrics:**  
- 60fps minimum on mid-range mobile devices.  
- <200ms latency between narration chunk and visual update.  
- User retention: 70% complete a full chapter in theater mode.

## 2. Features & Requirements

### 2.1 Core Features (MVP)
1. **EPUB Import & Parsing**  
   - Drag-and-drop or file upload.  
   - Extract chapters, TOC, metadata (genre for auto-effect suggestion).  
   - Use `epubjs` or equivalent.

2. **Narration Engine**  
   - Browser SpeechSynthesis (fallback) + ElevenLabs/Azure TTS API for high-quality, emotional voices.  
   - Real-time chunking: emit spoken text segments via `onboundary`.  
   - Sync with pre-recorded audiobooks via timestamped transcripts (Whisper integration optional).

3. **Pretext Text Rendering (Foreground Canvas)**  
   - Render only the currently spoken paragraph/chunk using `prepareWithSegments` + `layoutWithLines`.  
   - Theatrical styling: large font, soft shadow/glow, centered or justified layout.  
   - Highlight current sentence/phrase (subtle color shift).  
   - Auto-reflow on resize/orientation change.

4. **AI Scene Intelligence**  
   - Local (`@xenova/transformers`) + cloud (Grok/Claude/GPT-4o) hybrid.  
   - Every 3–5 seconds or on narration boundary: analyze chunk → generate visual prompt + mood + particle instructions.  
   - Maintain story memory (Zustand store: characters, location, tone history).  
   - Auto-suggest effects based on genre/metadata.

5. **Visual Engine (Background + Sticky Overlay Canvases)**  
   - **Background Canvas:** Procedural drawing (gradients, parallax layers, simple shapes) or AI image gen (Flux/Replicate) with cross-fade every 10–15s.  
   - **Sticky Overlay Canvas:** Narrative-driven particles, lighting, vignettes, silhouettes that react to audio amplitude, sentiment, and Pretext text bounds.  
   - Examples: floating embers (fantasy), rain (noir), gentle fog (mystery). Intensity slider (0–100%).

6. **Responsive Theater Mode**  
   - Full-screen cinematic UI (minimal controls on hover/tap).  
   - Mobile-first breakpoints.  
   - Orientation-aware layout (portrait: stacked; landscape: wider text + scene).

7. **Controls & Polish**  
   - Play/pause, speed (0.8x–1.5x), voice selector.  
   - Effect intensity + preset themes ("Epic", "Intimate", "Minimal").  
   - Progress bar with chapter navigation.  
   - Bookmarking, search, annotations (drawn on overlay).  
   - Toggle "Visuals Off" fallback to plain Pretext text + audio.

### 2.2 Non-Functional Requirements
- **Performance:** 60–120fps on mobile (iPhone 13+, Android mid-range). Pretext `layout()` must stay <0.1ms.  
- **Accessibility:** ARIA labels, keyboard/touch navigation, high-contrast mode, visuals toggle.  
- **Offline:** PWA support; cache EPUB + pre-generate TTS where possible.  
- **Privacy:** Local AI preferred; cloud calls optional and consented.  
- **Browser Support:** Chrome, Safari, Firefox (latest) on mobile/desktop.  
- **Tech Stack:** Vite + React 19 + TypeScript + Tailwind + Zustand + Pretext + Canvas/WebGL (Three.js optional for advanced scenes).

### 2.3 Out of Scope (Phase 2+)
- Multi-user sync.  
- 3D/WebGL full scenes.  
- Video export of performance.  
- Native mobile apps (React Native wrapper later).

## 3. User Flows
1. Upload EPUB → Auto-detect genre → Choose voice → Start theater mode.  
2. Narration plays → Text highlights on Pretext canvas → AI updates scene + effects in real-time.  
3. Resize/orientation change → Pretext instantly re-layouts text to new width → Scene scales.  
4. Tap to pause → Controls fade in.

## 4. Risks & Dependencies
- Pretext mobile: Fully supported via Canvas (see Reference docs).  
- AI latency: Mitigate with local-first + caching.  
- Canvas battery on mobile: Throttle particles to 30fps when idle.  
- TTS quality variability: Provide fallback voices.

## 5. Timeline & Milestones
- Week 1–2: Pretext integration + responsive Canvas foundation.  
- Week 3–4: TTS + AI scene loop.  
- Week 5–6: Effects + theater UI.  
- Week 7: Mobile testing + polish.  
- Week 8: Beta release.

**Approved By:** Manus AI – Product Owner  
**Date:** March 29, 2026
