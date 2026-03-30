import { useEffect, useRef, useState } from 'react';
import { useNarration } from '@/hooks/useNarration';
import { useAIScene } from '@/hooks/useAIScene';
import { usePWA } from '@/hooks/usePWA';
import { useNarrationStore } from '@/stores/narrationStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useEffectStore } from '@/stores/effectStore';
import { useDeviceStore } from '@/stores/deviceStore';
import SceneCanvas from '@/components/SceneCanvas';
import TextCanvas from '@/components/TextCanvas';
import OverlayCanvas from '@/components/OverlayCanvas';
import BookmarksPanel from '@/components/BookmarksPanel';
import SettingsPanel from '@/components/SettingsPanel';
import ProgressBar from '@/components/ProgressBar';
import { Play, Pause, Volume2, Settings, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/**
 * Theater mode page - the main performative audiobook experience.
 */
export default function Theater() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const { isInstallable, install } = usePWA();

  const { isReady, isPlaying, playbackSpeed, currentChunk, play, pause, resume, togglePlayPause, setSpeed } = useNarration();

  const { currentChapterContent, chapters, currentChapterIndex, currentCharIndex } = useNarrationStore();
  const { updateFromWindow, breakpoint, orientation, screenWidth, screenHeight } = useDeviceStore();
  const { theme, effectIntensity, setEffectIntensity, setTheme } = useEffectStore();

  const currentChapter = chapters[currentChapterIndex];

  // Initialize AI scene analysis
  useAIScene(currentChunk, {
    useCloud: false,
    analysisInterval: 3000,
  });

  // Update device info on mount and resize
  useEffect(() => {
    updateFromWindow();
    const handleResize = () => updateFromWindow();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateFromWindow]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeout) clearTimeout(controlsTimeout);

    if (showControls && isPlaying) {
      const timeout = setTimeout(() => setShowControls(false), 5000);
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [showControls, isPlaying, controlsTimeout]);

  const handleContainerClick = () => {
    setShowControls(!showControls);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      onClick={handleContainerClick}
      onMouseMove={handleMouseMove}
    >
      {/* Background Scene Canvas */}
      <div className="absolute inset-0">
        <SceneCanvas />
      </div>

      {/* Text Canvas - Center */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-90'
        }`}
      >
        <div
          className={`relative ${
            orientation === 'portrait'
              ? 'w-[90vw] h-[60vh]'
              : 'w-[70vw] h-[80vh]'
          }`}
        >
          <TextCanvas />
        </div>
      </div>

      {/* Overlay Canvas - Particles */}
      <OverlayCanvas />

      {/* Settings Panel - Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {/* Bookmarks Panel - Overlay */}
      {showBookmarks && currentChapter && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Bookmarks</h2>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <BookmarksPanel
              chapterId={currentChapter.id}
              chapterTitle={currentChapter.title}
              currentPosition={currentCharIndex}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Progress Bar */}
          <ProgressBar />

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => togglePlayPause()}
              disabled={!isReady}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Speed:</span>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={(value) => setSpeed(value[0])}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400 w-12">{playbackSpeed.toFixed(1)}x</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Effects:</span>
                <Slider
                  value={[effectIntensity]}
                  onValueChange={(value) => setEffectIntensity(value[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400 w-12">{Math.round(effectIntensity * 100)}%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBookmarks(!showBookmarks)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                title="Bookmarks"
              >
                <BookOpen className="w-5 h-5" />
              </Button>

              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {isInstallable && (
                <Button
                  onClick={install}
                  variant="ghost"
                  size="sm"
                  className="text-amber-500 hover:bg-amber-500/20"
                  title="Install App"
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}

              <Button
                onClick={() => setShowControls(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Chapter Info */}
          {currentChapter && (
            <div className="text-sm text-gray-300">
              <div className="font-semibold">{currentChapter.title}</div>
              {currentChunk && (
                <div className="line-clamp-1 italic text-gray-400">
                  "{currentChunk.substring(0, 80)}..."
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Device Info (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-xs text-gray-500 bg-black/50 p-2 rounded">
          <div>{breakpoint} - {orientation}</div>
          <div>{screenWidth}x{screenHeight}</div>
        </div>
      )}
    </div>
  );
}
