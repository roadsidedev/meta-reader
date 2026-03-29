import { create } from 'zustand';

export type Theme = 'epic' | 'intimate' | 'minimal';

export interface EffectState {
  theme: Theme;
  effectIntensity: number;
  visualsEnabled: boolean;
  particlesEnabled: boolean;
  particleCount: number;
  maxParticles: number;
  animationSpeed: number;
  audioReactivity: number;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

export interface EffectActions {
  setTheme: (theme: Theme) => void;
  setEffectIntensity: (intensity: number) => void;
  setVisualsEnabled: (enabled: boolean) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setParticleCount: (count: number) => void;
  setMaxParticles: (max: number) => void;
  setAnimationSpeed: (speed: number) => void;
  setAudioReactivity: (reactivity: number) => void;
  setColors: (bg: string, text: string, accent: string) => void;
  applyTheme: (theme: Theme) => void;
  reset: () => void;
}

const themeConfigs: Record<Theme, Partial<EffectState>> = {
  epic: {
    theme: 'epic',
    effectIntensity: 0.8,
    particlesEnabled: true,
    maxParticles: 150,
    animationSpeed: 1.2,
    audioReactivity: 0.9,
    backgroundColor: '#1a1a2e',
    textColor: '#e0e0e0',
    accentColor: '#ffd700',
  },
  intimate: {
    theme: 'intimate',
    effectIntensity: 0.4,
    particlesEnabled: true,
    maxParticles: 30,
    animationSpeed: 0.5,
    audioReactivity: 0.3,
    backgroundColor: '#8b6f47',
    textColor: '#f5f5f0',
    accentColor: '#c9a961',
  },
  minimal: {
    theme: 'minimal',
    effectIntensity: 0.1,
    particlesEnabled: false,
    maxParticles: 0,
    animationSpeed: 0.2,
    audioReactivity: 0,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#666666',
  },
};

const initialState: EffectState = {
  theme: 'epic',
  effectIntensity: 0.8,
  visualsEnabled: true,
  particlesEnabled: true,
  particleCount: 0,
  maxParticles: 150,
  animationSpeed: 1.2,
  audioReactivity: 0.9,
  backgroundColor: '#1a1a2e',
  textColor: '#e0e0e0',
  accentColor: '#ffd700',
};

export const useEffectStore = create<EffectState & EffectActions>((set) => ({
  ...initialState,

  setTheme: (theme: Theme) => set({ theme }),

  setEffectIntensity: (intensity: number) => set({ effectIntensity: Math.max(0, Math.min(1, intensity)) }),

  setVisualsEnabled: (enabled: boolean) => set({ visualsEnabled: enabled }),

  setParticlesEnabled: (enabled: boolean) => set({ particlesEnabled: enabled }),

  setParticleCount: (count: number) => set({ particleCount: count }),

  setMaxParticles: (max: number) => set({ maxParticles: max }),

  setAnimationSpeed: (speed: number) => set({ animationSpeed: Math.max(0.1, Math.min(2, speed)) }),

  setAudioReactivity: (reactivity: number) => set({ audioReactivity: Math.max(0, Math.min(1, reactivity)) }),

  setColors: (bg: string, text: string, accent: string) =>
    set({
      backgroundColor: bg,
      textColor: text,
      accentColor: accent,
    }),

  applyTheme: (theme: Theme) => {
    const config = themeConfigs[theme];
    set({
      ...config,
      particleCount: 0, // Reset particle count when changing theme
    });
  },

  reset: () => set(initialState),
}));
