import { create } from 'zustand';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceState {
  breakpoint: Breakpoint;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  isTouchDevice: boolean;
  isLowBattery: boolean;
  batteryLevel: number;
}

export interface DeviceActions {
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setOrientation: (orientation: Orientation) => void;
  setScreenDimensions: (width: number, height: number) => void;
  setDevicePixelRatio: (ratio: number) => void;
  setIsTouchDevice: (isTouchDevice: boolean) => void;
  setIsLowBattery: (isLowBattery: boolean) => void;
  setBatteryLevel: (level: number) => void;
  updateFromWindow: () => void;
}

const initialState: DeviceState = {
  breakpoint: 'mobile',
  orientation: 'portrait',
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
  screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
  isLowBattery: false,
  batteryLevel: 1.0,
};

function getBreakpoint(width: number): Breakpoint {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return width > height ? 'landscape' : 'portrait';
}

export const useDeviceStore = create<DeviceState & DeviceActions>((set) => ({
  ...initialState,

  setBreakpoint: (breakpoint: Breakpoint) => set({ breakpoint }),

  setOrientation: (orientation: Orientation) => set({ orientation }),

  setScreenDimensions: (width: number, height: number) =>
    set({
      screenWidth: width,
      screenHeight: height,
      breakpoint: getBreakpoint(width),
      orientation: getOrientation(width, height),
    }),

  setDevicePixelRatio: (ratio: number) => set({ devicePixelRatio: ratio }),

  setIsTouchDevice: (isTouchDevice: boolean) => set({ isTouchDevice }),

  setIsLowBattery: (isLowBattery: boolean) => set({ isLowBattery }),

  setBatteryLevel: (level: number) => set({ batteryLevel: Math.max(0, Math.min(1, level)), isLowBattery: level < 0.2 }),

  updateFromWindow: () => {
    if (typeof window === 'undefined') return;

    set({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      breakpoint: getBreakpoint(window.innerWidth),
      orientation: getOrientation(window.innerWidth, window.innerHeight),
      devicePixelRatio: window.devicePixelRatio,
      isTouchDevice: 'ontouchstart' in window,
    });
  },
}));
