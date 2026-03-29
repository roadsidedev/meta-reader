import { create } from 'zustand';

export interface NarrationState {
  isPlaying: boolean;
  currentChapterIndex: number;
  currentChunkIndex: number;
  currentCharIndex: number;
  playbackSpeed: number;
  selectedVoiceId: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  currentChunk: string;
  currentChapterContent: string;
  duration: number;
  currentTime: number;
}

export interface NarrationActions {
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentChapterIndex: (index: number) => void;
  setCurrentChunkIndex: (index: number) => void;
  setCurrentCharIndex: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSelectedVoiceId: (voiceId: string) => void;
  setChapters: (chapters: NarrationState['chapters']) => void;
  setCurrentChunk: (chunk: string) => void;
  setCurrentChapterContent: (content: string) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  reset: () => void;
}

const initialState: NarrationState = {
  isPlaying: false,
  currentChapterIndex: 0,
  currentChunkIndex: 0,
  currentCharIndex: 0,
  playbackSpeed: 1.0,
  selectedVoiceId: '',
  chapters: [],
  currentChunk: '',
  currentChapterContent: '',
  duration: 0,
  currentTime: 0,
};

export const useNarrationStore = create<NarrationState & NarrationActions>((set) => ({
  ...initialState,

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  setCurrentChapterIndex: (index: number) =>
    set((state) => ({
      currentChapterIndex: index,
      currentChapterContent: state.chapters[index]?.content || '',
      currentChunkIndex: 0,
      currentCharIndex: 0,
    })),

  setCurrentChunkIndex: (index: number) => set({ currentChunkIndex: index }),

  setCurrentCharIndex: (index: number) => set({ currentCharIndex: index }),

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: Math.max(0.5, Math.min(2.0, speed)) }),

  setSelectedVoiceId: (voiceId: string) => set({ selectedVoiceId: voiceId }),

  setChapters: (chapters: NarrationState['chapters']) =>
    set((state) => ({
      chapters,
      currentChapterContent: chapters[state.currentChapterIndex]?.content || '',
    })),

  setCurrentChunk: (chunk: string) => set({ currentChunk: chunk }),

  setCurrentChapterContent: (content: string) => set({ currentChapterContent: content }),

  setDuration: (duration: number) => set({ duration }),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  reset: () => set(initialState),
}));
