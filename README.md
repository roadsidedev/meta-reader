# StoryStage: Performative Audiobook Reader

Transform any EPUB ebook into an immersive "mind-movie" theater experience. As narration audio plays, the screen becomes a living stage with Pretext-powered text rendering, AI-generated scenes, and narrative-driven visual effects.

## 🎬 Vision

StoryStage reimagines audiobook consumption by combining three synchronized elements:

1. **Theatrical Text Rendering** – Pretext-powered Canvas displays the currently spoken text with pixel-perfect typography, soft shadows, and real-time highlighting.

2. **AI Scene Intelligence** – Real-time analysis of narration generates adaptive background scenes and mood-driven visual effects that enhance immersion without distraction.

3. **Responsive Theater Mode** – Mobile-first cinematic interface with minimal controls, full-screen immersion, and instant responsiveness to device orientation changes.

## ✨ Key Features

- **EPUB Import & Parsing** – Drag-and-drop file upload with automatic chapter extraction and metadata detection.
- **Narration Engine** – ElevenLabs TTS (primary) + Browser SpeechSynthesis (fallback) with real-time text boundary events.
- **Pretext Text Rendering** – Canvas-native text with theatrical styling, auto-highlighting, and instant responsive reflow.
- **AI Scene Analysis** – Hybrid local (@xenova/transformers) + cloud (Claude/GPT-4o) mood analysis and visual prompt generation.
- **Visual Effects** – Procedural background canvas, particle system, lighting, and vignettes that react to audio and sentiment.
- **Theater Controls** – Play/pause, speed control (0.8x–1.5x), voice selector, effect intensity slider, theme presets.
- **Bookmarking & Annotations** – Save positions, add notes, and draw annotations on the overlay canvas.
- **PWA Support** – Offline playback with cached EPUB files and pre-generated TTS audio.
- **Accessibility** – ARIA labels, keyboard navigation, high-contrast mode, visuals toggle, screen reader support.

## 🎯 Performance Targets

- **Frame Rate:** 60fps minimum on mid-range mobile (iPhone 13, Galaxy A52).
- **Pretext Layout:** <0.1ms per text layout.
- **AI Latency:** <200ms from narration boundary to visual update.
- **Initial Load:** <3s on 4G.
- **Battery:** <5% drain per hour of playback.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| Build | Vite |
| State | Zustand |
| Text Rendering | Pretext (@chenglou/pretext) |
| Audio | Web Audio API + SpeechSynthesis |
| EPUB Parsing | epubjs |
| AI (Local) | @xenova/transformers |
| AI (Cloud) | Claude/GPT-4o API |
| TTS | ElevenLabs API |
| Animations | Framer Motion |
| PWA | Workbox |

## 📁 Project Structure

```
story-stage/
├── client/
│   ├── public/           # Static assets (favicon, manifest)
│   ├── src/
│   │   ├── pages/        # Page components (Home, Theater)
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand state stores
│   │   ├── lib/          # Utility functions and services
│   │   ├── App.tsx       # Main app component
│   │   ├── main.tsx      # React entry point
│   │   └── index.css     # Global styles
│   └── index.html
├── docs/                 # Reference documentation
│   ├── PRETEXT_INTEGRATION.md
│   ├── AI_TTS_SCENE_ENGINE.md
│   ├── UI_COMPONENTS_AND_CONTROLS.md
│   └── PERFORMANCE_MOBILE_GUIDE.md
├── ARCHITECTURE.md       # System architecture
├── PRD.md               # Product requirements
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm 10+
- EPUB files for testing
- API keys: ElevenLabs (optional), Claude/GPT-4o (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/molty-miles/audio-pretext.git
cd audio-pretext

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Add API keys to .env.local
VITE_ELEVENLABS_API_KEY=your_key_here
VITE_CLAUDE_API_KEY=your_key_here
```

### Development

```bash
# Start dev server
pnpm dev

# Open browser
# Navigate to http://localhost:5173
```

### Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

## 📚 Documentation

Comprehensive guides are available in the `docs/` directory:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** – System design, data flow, responsive strategy, and technology decisions.
- **[PRETEXT_INTEGRATION.md](./PRETEXT_INTEGRATION.md)** – Pretext API usage, mobile adaptation, and responsive layout patterns.
- **[AI_TTS_SCENE_ENGINE.md](./AI_TTS_SCENE_ENGINE.md)** – TTS implementation, AI scene analysis, and particle system design.
- **[UI_COMPONENTS_AND_CONTROLS.md](./UI_COMPONENTS_AND_CONTROLS.md)** – Theater mode interface, responsive breakpoints, theme presets, and accessibility features.
- **[PERFORMANCE_MOBILE_GUIDE.md](./PERFORMANCE_MOBILE_GUIDE.md)** – Performance optimization, mobile testing, and deployment checklist.

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Profile performance
pnpm profile
```

## 📱 Mobile Testing

### Chrome DevTools Emulation

1. Open DevTools (F12).
2. Toggle device mode (Ctrl+Shift+M).
3. Select iPhone 13 or Galaxy A52.
4. Throttle network to "Slow 4G" and CPU to "4x slowdown".
5. Profile with Performance tab.

### Real Device Testing

**iOS:** Use Safari DevTools via Mac to debug on real iPhone.

**Android:** Use Chrome DevTools remote debugging.

## 🎨 Design System

### Color Palette

**Light Theme:**
- Background: `#ffffff`
- Foreground: `#1a1a1a`
- Primary: `#0066cc`
- Accent: `#ff6b35`

**Dark Theme:**
- Background: `#0a0a0a`
- Foreground: `#f5f5f5`
- Primary: `#4d9fff`
- Accent: `#ff8c42`

### Typography

- **Display:** Georgia (serif) – 32px–48px, bold
- **Body:** Inter (sans-serif) – 16px–18px, regular
- **UI:** Inter (sans-serif) – 14px–16px, medium

### Spacing

- Base unit: 8px
- Scales: 4px, 8px, 12px, 16px, 24px, 32px, 48px

## 🔐 Privacy & Security

- **Local AI:** Preferred for privacy; all local analysis stays on-device.
- **Cloud APIs:** Optional and require explicit user consent.
- **Data Storage:** EPUB files and bookmarks stored locally in IndexedDB.
- **No Tracking:** No analytics or user tracking beyond optional error reporting.

## 📊 Deployment

StoryStage is designed for deployment on static hosting (Vercel, Netlify, GitHub Pages) or traditional web servers.

### Environment Variables

```
VITE_ELEVENLABS_API_KEY=your_key
VITE_CLAUDE_API_KEY=your_key
VITE_GROK_API_KEY=your_key
```

### Build & Deploy

```bash
# Build for production
pnpm build

# Deploy dist/ directory to hosting provider
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit changes (`git commit -m 'Add amazing feature'`).
4. Push to branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📝 License

MIT License – see LICENSE file for details.

## 🙏 Acknowledgments

- **Pretext** (@chenglou/pretext) – Canvas-native text rendering.
- **ElevenLabs** – High-quality TTS voices.
- **Transformers.js** – Local AI analysis.
- **React & Vite** – Modern web development.

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ by Manus AI**  
**Last Updated:** March 29, 2026
