import { useNarrationStore } from '@/stores/narrationStore';

interface ProgressBarProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Progress bar component for tracking reading position in chapter.
 */
export default function ProgressBar({ className = '', showLabel = true }: ProgressBarProps) {
  const { currentCharIndex, currentChapterContent } = useNarrationStore();

  const totalChars = currentChapterContent?.length || 1;
  const progress = Math.min((currentCharIndex / totalChars) * 100, 100);

  const formatTime = (chars: number) => {
    // Estimate: ~200 words per minute = ~1000 chars per minute
    const minutes = Math.round(chars / 1000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const currentTime = formatTime(currentCharIndex);
  const totalTime = formatTime(totalChars);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {showLabel && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{currentTime}</span>
          <span>{Math.round(progress)}%</span>
          <span>{totalTime}</span>
        </div>
      )}
    </div>
  );
}
