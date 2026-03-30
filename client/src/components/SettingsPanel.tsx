import { useNarrationStore } from '@/stores/narrationStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useEffectStore } from '@/stores/effectStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Settings, Volume2, Zap, Palette } from 'lucide-react';

interface SettingsPanelProps {
  onClose?: () => void;
}

/**
 * Settings panel for theater mode configuration.
 */
export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { playbackSpeed, setPlaybackSpeed } = useNarrationStore();
  const { intensity: sceneIntensity, setIntensity } = useSceneStore();
  const {
    theme,
    setTheme,
    effectIntensity,
    setEffectIntensity,
    particlesEnabled,
    setParticlesEnabled,
    visualsEnabled,
    setVisualsEnabled,
  } = useEffectStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Playback Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Playback
        </h3>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Playback Speed</label>
          <div className="flex items-center gap-4">
            <Slider
              value={[playbackSpeed]}
              onValueChange={(value) => setPlaybackSpeed(value[0])}
              min={0.5}
              max={2.0}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-gray-400 w-12">{playbackSpeed.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Visual Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Visuals
        </h3>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Scene Intensity</label>
          <div className="flex items-center gap-4">
            <Slider
              value={[sceneIntensity]}
              onValueChange={(value) => setIntensity(value[0])}
              min={0}
              max={1}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm text-gray-400 w-12">{Math.round(sceneIntensity * 100)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Effect Intensity</label>
          <div className="flex items-center gap-4">
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

        {/* Toggle Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={visualsEnabled}
              onChange={(e) => setVisualsEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Enable Background Visuals</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={particlesEnabled}
              onChange={(e) => setParticlesEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Enable Particle Effects</span>
          </label>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {(['epic', 'intimate', 'minimal'] as const).map((t) => (
            <Button
              key={t}
              onClick={() => setTheme(t)}
              variant={theme === t ? 'default' : 'outline'}
              className={`capitalize ${
                theme === t
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Performance Info */}
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-sm text-gray-300">
        <p className="font-semibold text-white mb-2">Performance Tips:</p>
        <ul className="space-y-1 text-xs">
          <li>• Disable particles on lower-end devices for better performance</li>
          <li>• Reduce effect intensity to save battery on mobile</li>
          <li>• Use minimal theme for distraction-free reading</li>
        </ul>
      </div>
    </div>
  );
}
