# AI, TTS & Scene Engine Reference

## TTS Implementation

The narration engine uses a tiered approach to balance quality and latency:

**Primary:** ElevenLabs API provides emotional, character-specific voices with natural prosody. Supports multiple languages and custom voice cloning.

**Fallback:** Browser SpeechSynthesis with `onboundary` events for real-time text chunking. Provides instant fallback if API fails or user prefers local synthesis.

**Sync:** Store current character index and map to Pretext line ranges for precise text highlighting as narration plays.

### Implementation Pattern

```typescript
// ElevenLabs TTS with boundary events
const synthesizeWithElevenLabs = async (text: string, voiceId: string) => {
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  return response.arrayBuffer();
};

// Browser SpeechSynthesis fallback
const synthesizeWithBrowser = (text: string, voice: SpeechSynthesisVoice) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.onboundary = (event) => {
    const charIndex = event.charIndex;
    // Map to Pretext lines and highlight
    updateHighlightedText(charIndex);
  };
  speechSynthesis.speak(utterance);
};
```

## AI Scene Analysis Flow

The AI layer runs in a continuous loop, analyzing narration and generating visual directives:

1. **On narration boundary** – Send 5–10 second chunk + story memory to AI.
2. **Prompt construction** – Include current narration, story state (characters, location, tone), and genre metadata.
3. **AI response** – Receive visual prompt, mood classification ('fantasy'|'noir'|'intimate'), particle type, and intensity (0-1).
4. **Continuity** – Maintain story memory to ensure smooth visual transitions between scenes.

### Prompt Example

```
Given narration: "The ancient forest loomed before them, its towering oaks casting long shadows across the moss-covered ground."

Current story state:
- Characters: Elara (brave, determined), Kael (cautious, observant)
- Location: Whisperwood Forest
- Tone: Mysterious, slightly ominous
- Previous mood: Anticipation

Genre: Fantasy

Output required:
- visualPrompt: A detailed description for background generation
- mood: One of 'fantasy', 'noir', 'intimate', 'mysterious', 'action', 'peaceful'
- particleType: 'embers', 'rain', 'fog', 'leaves', 'dust', 'none'
- intensity: 0.0 to 1.0
- colorPalette: ['#2d5016', '#8b7355', '#d4a574']

Ensure continuity with previous scene. Keep the mood consistent unless the narrative clearly shifts.
```

## Local AI Fallback

For offline or low-latency scenarios, use `@xenova/transformers`:

```typescript
import { pipeline } from '@xenova/transformers';

const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');

const result = await classifier(narrationChunk, ['fantasy', 'noir', 'intimate', 'action', 'peaceful']);
// Returns: { labels: ['fantasy', 'noir', ...], scores: [0.85, 0.12, ...] }
```

This provides instant mood classification without cloud latency, enabling immediate visual updates.

## Scene Rendering

**Procedural Canvas (fastest for mobile):** Gradients, particles, parallax layers, and simple shapes rendered directly to canvas. Enables 60fps on mid-range devices.

**Optional AI image generation:** Generate every 15 seconds via Replicate/Flux, cross-fade with `globalAlpha` for smooth transitions.

### Procedural Background Example

```typescript
const drawProceduralBackground = (ctx: CanvasRenderingContext2D, mood: string, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  
  switch (mood) {
    case 'fantasy':
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      break;
    case 'noir':
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, '#1a1a1a');
      gradient.addColorStop(1, '#2a2a2a');
      break;
    case 'intimate':
      gradient.addColorStop(0, '#8b6f47');
      gradient.addColorStop(0.5, '#a0826d');
      gradient.addColorStop(1, '#c9a961');
      break;
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};
```

## Sticky Effects (Overlay Canvas)

Particles react to multiple inputs: audio volume (via Web Audio Analyser), AI mood classification, and Pretext text bounds.

**Max particle count:** 50 on mobile, 150 on desktop.

**Particle types:** Embers (fantasy), rain (noir), fog (mystery), leaves (nature), dust (action), none (minimal).

### Particle System Example

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'ember' | 'rain' | 'fog' | 'leaf' | 'dust';
}

const updateParticles = (particles: Particle[], audioLevel: number, deltaTime: number) => {
  particles.forEach((p) => {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.life -= deltaTime;
    
    // React to audio amplitude
    if (audioLevel > 0.5) {
      p.vy *= 1.1; // Particles move faster with louder audio
    }
  });
  
  // Remove dead particles
  return particles.filter((p) => p.life > 0);
};
```

## Performance Considerations

**AI Latency:** Target <200ms total latency from narration boundary to visual update. Achieve this through:
- Local-first analysis (transformers for instant mood).
- Caching previous scene prompts.
- Async cloud API calls that don't block rendering.

**Canvas Battery:** On mobile with low battery (<20%), throttle particle updates to 30fps instead of 60fps.

**Memory:** Pre-allocate particle arrays and reuse objects to minimize garbage collection.
