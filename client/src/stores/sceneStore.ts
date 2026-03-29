import { create } from 'zustand';

export type Mood = 'fantasy' | 'noir' | 'intimate' | 'mysterious' | 'action' | 'peaceful';
export type ParticleType = 'embers' | 'rain' | 'fog' | 'leaves' | 'dust' | 'none';

export interface StoryMemory {
  characters: string[];
  location: string;
  tone: string;
  previousMood: Mood;
  recentEvents: string[];
}

export interface SceneState {
  mood: Mood;
  visualPrompt: string;
  particleType: ParticleType;
  intensity: number;
  colorPalette: string[];
  storyMemory: StoryMemory;
  lastUpdateTime: number;
  isAnalyzing: boolean;
}

export interface SceneActions {
  setMood: (mood: Mood) => void;
  setVisualPrompt: (prompt: string) => void;
  setParticleType: (type: ParticleType) => void;
  setIntensity: (intensity: number) => void;
  setColorPalette: (colors: string[]) => void;
  updateStoryMemory: (memory: Partial<StoryMemory>) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  updateScene: (scene: Partial<SceneState>) => void;
  reset: () => void;
}

const initialState: SceneState = {
  mood: 'peaceful',
  visualPrompt: '',
  particleType: 'none',
  intensity: 0.5,
  colorPalette: ['#1a1a2e', '#16213e', '#0f3460'],
  storyMemory: {
    characters: [],
    location: '',
    tone: 'neutral',
    previousMood: 'peaceful',
    recentEvents: [],
  },
  lastUpdateTime: 0,
  isAnalyzing: false,
};

export const useSceneStore = create<SceneState & SceneActions>((set) => ({
  ...initialState,

  setMood: (mood: Mood) =>
    set((state) => ({
      mood,
      storyMemory: {
        ...state.storyMemory,
        previousMood: state.mood,
      },
    })),

  setVisualPrompt: (prompt: string) => set({ visualPrompt: prompt }),

  setParticleType: (type: ParticleType) => set({ particleType: type }),

  setIntensity: (intensity: number) => set({ intensity: Math.max(0, Math.min(1, intensity)) }),

  setColorPalette: (colors: string[]) => set({ colorPalette: colors }),

  updateStoryMemory: (memory: Partial<StoryMemory>) =>
    set((state) => ({
      storyMemory: {
        ...state.storyMemory,
        ...memory,
      },
    })),

  setIsAnalyzing: (isAnalyzing: boolean) => set({ isAnalyzing }),

  updateScene: (scene: Partial<SceneState>) =>
    set((state) => ({
      ...state,
      ...scene,
      lastUpdateTime: Date.now(),
    })),

  reset: () => set(initialState),
}));
