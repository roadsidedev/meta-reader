import { useEffect, useRef, useCallback, useState } from 'react';
import { HybridSceneAnalyzer } from '@/lib/aiAnalyzer';
import { useSceneStore, Mood, ParticleType } from '@/stores/sceneStore';

export interface UseAISceneOptions {
  useCloud?: boolean;
  analysisInterval?: number; // ms between analyses
}

/**
 * Custom hook for managing AI scene analysis and visual updates.
 */
export function useAIScene(narrationText: string, options: UseAISceneOptions = {}) {
  const {
    useCloud = false,
    analysisInterval = 3000, // Analyze every 3 seconds
  } = options;

  const analyzerRef = useRef<HybridSceneAnalyzer | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { setMood, setVisualPrompt, setParticleType, setIntensity, setColorPalette, setIsAnalyzing: setStoreIsAnalyzing, storyMemory } = useSceneStore();

  // Initialize analyzer
  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new HybridSceneAnalyzer();
    }
  }, []);

  // Analyze narration
  const analyze = useCallback(async () => {
    if (!narrationText || !analyzerRef.current) return;

    setIsAnalyzing(true);
    setStoreIsAnalyzing(true);
    setError(null);

    try {
      const storyContext = `Characters: ${storyMemory.characters.join(', ')}, Location: ${storyMemory.location}, Tone: ${storyMemory.tone}`;

      const analysis = await analyzerRef.current.analyze(narrationText, storyContext, useCloud);

      // Update scene store
      setMood(analysis.mood);
      setVisualPrompt(analysis.visualPrompt);
      setParticleType(analysis.particleType);
      setIntensity(analysis.intensity);
      setColorPalette(analysis.colorPalette);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to analyze scene');
      setError(error);
      console.error('Scene analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setStoreIsAnalyzing(false);
    }
  }, [narrationText, storyMemory, useCloud, setMood, setVisualPrompt, setParticleType, setIntensity, setColorPalette, setStoreIsAnalyzing]);

  // Periodic analysis
  useEffect(() => {
    if (!narrationText) return;

    // Analyze immediately
    analyze();

    // Set up periodic analysis
    analysisTimeoutRef.current = setInterval(analyze, analysisInterval);

    return () => {
      if (analysisTimeoutRef.current) {
        clearInterval(analysisTimeoutRef.current);
      }
    };
  }, [narrationText, analysisInterval, analyze]);

  // Manual analysis trigger
  const triggerAnalysis = useCallback(() => {
    analyze();
  }, [analyze]);

  return {
    isAnalyzing,
    error,
    analyze: triggerAnalysis,
  };
}
