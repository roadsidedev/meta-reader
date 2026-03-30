import { Howl } from 'howler';

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'browser' | 'elevenlabs';
}

export interface TTSChunk {
  id: string;
  text: string;
  startChar: number;
  endChar: number;
  startTime: number;
  endTime: number;
}

export interface TTSEvent {
  type: 'start' | 'boundary' | 'end' | 'error' | 'pause' | 'resume';
  chunk?: TTSChunk;
  error?: Error;
  currentTime?: number;
}

export type TTSEventListener = (event: TTSEvent) => void;

/**
 * Browser-based TTS using SpeechSynthesis API with boundary event tracking.
 */
export class BrowserTTSEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private voice: Voice;
  private listeners: Set<TTSEventListener> = new Set();
  private chunks: TTSChunk[] = [];
  private currentChunkIndex: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1.0;

  constructor(voice: Voice) {
    this.voice = voice;
  }

  /**
   * Get available browser voices.
   */
  static getAvailableVoices(): Voice[] {
    const voices: Voice[] = [];
    const synthVoices = speechSynthesis.getVoices();

    for (const sv of synthVoices) {
      voices.push({
        id: sv.voiceURI,
        name: sv.name,
        language: sv.lang,
        gender: sv.name.toLowerCase().includes('female') ? 'female' : 'male',
        provider: 'browser',
      });
    }

    return voices;
  }

  /**
   * Prepare text chunks for narration with timing information.
   */
  prepareChunks(text: string): TTSChunk[] {
    const chunks: TTSChunk[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let startChar = 0;
    let startTime = 0;
    const estimatedWordsPerSecond = 150 / 60; // ~150 words per minute

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const wordCount = sentence.split(/\s+/).length;
      const estimatedDuration = (wordCount / estimatedWordsPerSecond) * 1000; // in ms

      chunks.push({
        id: `chunk-${i}`,
        text: sentence,
        startChar,
        endChar: startChar + sentence.length,
        startTime,
        endTime: startTime + estimatedDuration,
      });

      startChar += sentence.length;
      startTime += estimatedDuration;
    }

    this.chunks = chunks;
    return chunks;
  }

  /**
   * Start narration playback.
   */
  async play(text: string, voice?: Voice): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    }

    if (voice) {
      this.voice = voice;
    }

    this.prepareChunks(text);
    this.isPlaying = true;
    this.currentChunkIndex = 0;

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.voice = speechSynthesis.getVoices().find((v) => v.voiceURI === this.voice.id) || null;
    this.utterance.rate = this.speed;
    this.utterance.pitch = 1.0;
    this.utterance.volume = 1.0;

    // Handle boundary events (character-by-character progress)
    this.utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      const chunk = this.chunks.find((c) => c.startChar <= charIndex && charIndex < c.endChar);

      if (chunk && chunk.id !== this.chunks[this.currentChunkIndex]?.id) {
        this.currentChunkIndex = this.chunks.indexOf(chunk);
        this.emit({
          type: 'boundary',
          chunk,
          currentTime: event.elapsedTime * 1000,
        });
      }
    };

    this.utterance.onstart = () => {
      this.emit({ type: 'start' });
      // Emit boundary for the first chunk so it's shown immediately
      if (this.chunks.length > 0) {
        this.emit({ type: 'boundary', chunk: this.chunks[0], currentTime: 0 });
      }
    };

    this.utterance.onend = () => {
      this.isPlaying = false;
      this.emit({ type: 'end' });
    };

    this.utterance.onerror = (event) => {
      this.isPlaying = false;
      this.emit({
        type: 'error',
        error: new Error(`TTS Error: ${event.error}`),
      });
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(this.utterance);
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (this.isPlaying) {
      speechSynthesis.pause();
      this.isPlaying = false;
      this.emit({ type: 'pause' });
    }
  }

  /**
   * Resume playback.
   */
  resume(): void {
    if (this.utterance && !this.isPlaying) {
      speechSynthesis.resume();
      this.isPlaying = true;
      this.emit({ type: 'resume' });
    }
  }

  /**
   * Stop playback.
   */
  stop(): void {
    speechSynthesis.cancel();
    this.isPlaying = false;
    this.utterance = null;
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.5, Math.min(2.0, speed));
    if (this.utterance) {
      this.utterance.rate = this.speed;
    }
  }

  /**
   * Add event listener.
   */
  addEventListener(listener: TTSEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener.
   */
  removeEventListener(listener: TTSEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit event to all listeners.
   */
  private emit(event: TTSEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

/**
 * ElevenLabs TTS Engine for high-quality narration.
 * API calls are proxied through the backend server (/api/tts/synthesize).
 */
export class ElevenLabsTTSEngine {
  private voiceId: string;
  private howl: Howl | null = null;
  private audioUrl: string | null = null;
  private listeners: Set<TTSEventListener> = new Set();
  private chunks: TTSChunk[] = [];
  private currentChunkIndex: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1.0;
  private currentTime: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(voiceId: string) {
    this.voiceId = voiceId;
  }

  /**
   * Prepare text chunks for narration.
   */
  prepareChunks(text: string): TTSChunk[] {
    const chunks: TTSChunk[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let startChar = 0;
    let startTime = 0;
    const estimatedWordsPerSecond = 150 / 60;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const wordCount = sentence.split(/\s+/).length;
      const estimatedDuration = (wordCount / estimatedWordsPerSecond) * 1000;

      chunks.push({
        id: `chunk-${i}`,
        text: sentence,
        startChar,
        endChar: startChar + sentence.length,
        startTime,
        endTime: startTime + estimatedDuration,
      });

      startChar += sentence.length;
      startTime += estimatedDuration;
    }

    this.chunks = chunks;
    return chunks;
  }

  /**
   * Synthesize text via the backend proxy (/api/tts/synthesize).
   */
  private async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await fetch('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: this.voiceId }),
    });

    if (!response.ok) {
      throw new Error(`TTS proxy error: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Start narration playback.
   */
  async play(text: string): Promise<void> {
    try {
      if (this.isPlaying) {
        this.stop();
      }

      this.prepareChunks(text);
      this.isPlaying = true;
      this.currentChunkIndex = 0;
      this.currentTime = 0;

      this.emit({ type: 'start' });

      // Synthesize audio
      const audioBuffer = await this.synthesize(text);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      this.audioUrl = URL.createObjectURL(blob);

      // Create Howl instance
      this.howl = new Howl({
        src: [this.audioUrl],
        rate: this.speed,
        onplay: () => {
          this.emit({ type: 'start' });
        },
        onstop: () => {
          this.isPlaying = false;
          this.emit({ type: 'end' });
          this.clearUpdateInterval();
        },
        onend: () => {
          this.isPlaying = false;
          this.emit({ type: 'end' });
          this.clearUpdateInterval();
        },
      });

      // Start playback
      this.howl.play();

      // Track progress and emit boundary events
      this.startUpdateInterval();
    } catch (error) {
      this.isPlaying = false;
      this.emit({
        type: 'error',
        error: error instanceof Error ? error : new Error('Unknown TTS error'),
      });
    }
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (this.howl && this.isPlaying) {
      this.howl.pause();
      this.isPlaying = false;
      this.emit({ type: 'pause' });
      this.clearUpdateInterval();
    }
  }

  /**
   * Resume playback.
   */
  resume(): void {
    if (this.howl && !this.isPlaying) {
      this.howl.play();
      this.isPlaying = true;
      this.emit({ type: 'resume' });
      this.startUpdateInterval();
    }
  }

  /**
   * Stop playback and release audio resources.
   */
  stop(): void {
    this.clearUpdateInterval();
    if (this.howl) {
      this.howl.stop();
      this.howl.unload();
      this.howl = null;
      this.isPlaying = false;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }

  /**
   * Set playback speed.
   */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.5, Math.min(2.0, speed));
    if (this.howl) {
      this.howl.rate(this.speed);
    }
  }

  /**
   * Add event listener.
   */
  addEventListener(listener: TTSEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener.
   */
  removeEventListener(listener: TTSEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit event to all listeners.
   */
  private emit(event: TTSEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Start tracking playback progress.
   */
  private startUpdateInterval(): void {
    this.updateInterval = setInterval(() => {
      if (!this.howl || !this.isPlaying) return;

      this.currentTime = this.howl.seek() * 1000; // Convert to ms

      // Check if we've crossed a chunk boundary
      const chunk = this.chunks.find((c) => c.startTime <= this.currentTime && this.currentTime < c.endTime);

      if (chunk && chunk.id !== this.chunks[this.currentChunkIndex]?.id) {
        this.currentChunkIndex = this.chunks.indexOf(chunk);
        this.emit({
          type: 'boundary',
          chunk,
          currentTime: this.currentTime,
        });
      }
    }, 100); // Update every 100ms
  }

  /**
   * Clear update interval.
   */
  private clearUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
