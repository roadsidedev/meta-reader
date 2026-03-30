import { useEffect, useRef, useCallback, useState } from 'react';
import { BrowserTTSEngine, ElevenLabsTTSEngine, Voice, TTSEvent } from '@/lib/ttsEngine';
import { useNarrationStore } from '@/stores/narrationStore';

export interface UseNarrationOptions {
  useElevenLabs?: boolean;
  elevenLabsVoiceId?: string;
}

/**
 * Custom hook for managing narration playback with TTS engine.
 */
export function useNarration(options: UseNarrationOptions = {}) {
  const {
    useElevenLabs = false,
    elevenLabsVoiceId = 'EXAVITQu4vr4xnSDxMaL', // Default ElevenLabs voice
  } = options;

  const engineRef = useRef<BrowserTTSEngine | ElevenLabsTTSEngine | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [isReady, setIsReady] = useState(false);

  const {
    isPlaying,
    currentChunk,
    playbackSpeed,
    selectedVoiceId,
    currentChapterContent,
    setIsPlaying,
    setCurrentChunk,
    setPlaybackSpeed,
    setCurrentCharIndex,
  } = useNarrationStore();

  // Initialize TTS engine
  useEffect(() => {
    if (useElevenLabs) {
      engineRef.current = new ElevenLabsTTSEngine(elevenLabsVoiceId);
      setIsReady(true);
    } else {
      // Use browser TTS
      const voices = BrowserTTSEngine.getAvailableVoices();
      setAvailableVoices(voices);

      if (voices.length > 0) {
        engineRef.current = new BrowserTTSEngine(voices[0]);
        setIsReady(true);
      }

      // Listen for voice list changes
      const handleVoicesChanged = () => {
        const updatedVoices = BrowserTTSEngine.getAvailableVoices();
        setAvailableVoices(updatedVoices);
        if (!engineRef.current && updatedVoices.length > 0) {
          engineRef.current = new BrowserTTSEngine(updatedVoices[0]);
          setIsReady(true);
        }
      };

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    }
  }, [useElevenLabs, elevenLabsVoiceId]);

  // Handle TTS events
  useEffect(() => {
    if (!engineRef.current) return;

    const handleTTSEvent = (event: TTSEvent) => {
      switch (event.type) {
        case 'start':
          setIsPlaying(true);
          break;
        case 'boundary':
          if (event.chunk) {
            setCurrentChunk(event.chunk.text);
            setCurrentCharIndex(event.chunk.startChar);
          }
          break;
        case 'end':
          setIsPlaying(false);
          break;
        case 'pause':
          setIsPlaying(false);
          break;
        case 'resume':
          setIsPlaying(true);
          break;
        case 'error':
          console.error('TTS Error:', event.error);
          setIsPlaying(false);
          break;
      }
    };

    engineRef.current.addEventListener(handleTTSEvent);

    return () => {
      engineRef.current?.removeEventListener(handleTTSEvent);
    };
  }, [setIsPlaying, setCurrentChunk, setCurrentCharIndex]);

  // Update playback speed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  // Play narration
  const play = useCallback(async () => {
    if (!engineRef.current || !currentChapterContent) return;

    try {
      await engineRef.current.play(currentChapterContent);
    } catch (error) {
      console.error('Failed to play narration:', error);
    }
  }, [currentChapterContent]);

  // Pause narration
  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  // Resume narration
  const resume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  // Stop narration
  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  // Set voice
  const setVoice = useCallback((voiceId: string) => {
    if (!engineRef.current || engineRef.current instanceof ElevenLabsTTSEngine) return;

    const voice = availableVoices.find((v) => v.id === voiceId);
    if (voice) {
      engineRef.current = new BrowserTTSEngine(voice);
    }
  }, [availableVoices]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  return {
    isReady,
    isPlaying,
    currentChunk,
    playbackSpeed,
    availableVoices,
    selectedVoiceId,
    play,
    pause,
    resume,
    stop,
    togglePlayPause,
    setSpeed: setPlaybackSpeed,
    setVoice,
  };
}
