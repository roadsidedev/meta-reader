import { useState } from 'react';
import { useLocation } from 'wouter';
import EpubUploader from '@/components/EpubUploader';
import { ParsedEpub } from '@/lib/epubParser';
import { useNarrationStore } from '@/stores/narrationStore';
import { useSceneStore } from '@/stores/sceneStore';
import { Button } from '@/components/ui/button';
import { BookOpen, Play } from 'lucide-react';

/**
 * Home page - EPUB upload and chapter selection.
 */
export default function Home() {
  const [, setLocation] = useLocation();
  const [uploadedEpub, setUploadedEpub] = useState<ParsedEpub | null>(null);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

  const { chapters, setCurrentChapterIndex } = useNarrationStore();
  const { updateStoryMemory } = useSceneStore();

  const handleUploadSuccess = (epub: ParsedEpub) => {
    setUploadedEpub(epub);
  };

  const handleStartTheater = () => {
    if (chapters.length === 0) return;

    setCurrentChapterIndex(selectedChapterIndex);
    setLocation('/theater');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">StoryStage</h1>
            <p className="text-sm text-gray-400 ml-auto">Performative Audiobook Reader</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white">Transform Your Reading</h2>
            <p className="text-lg text-gray-300">
              Upload an EPUB file and experience immersive audiobook narration with synchronized text,
              AI-generated scenes, and dynamic visual effects.
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <EpubUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Chapter Selection */}
          {chapters.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 space-y-4">
              <h3 className="text-xl font-semibold text-white">Select Chapter</h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterIndex(index)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedChapterIndex === index
                        ? 'bg-amber-500/20 border border-amber-500 text-amber-100'
                        : 'bg-slate-700/50 border border-slate-600 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="font-medium">{chapter.title}</div>
                    <div className="text-sm text-gray-400 line-clamp-1">
                      {chapter.content.substring(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStartTheater}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-6 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Theater Mode
              </Button>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 space-y-2">
              <div className="text-2xl">🎭</div>
              <h4 className="font-semibold text-white">Theatrical Text</h4>
              <p className="text-sm text-gray-400">Pretext-powered canvas rendering with perfect typography</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 space-y-2">
              <div className="text-2xl">🎨</div>
              <h4 className="font-semibold text-white">AI Scenes</h4>
              <p className="text-sm text-gray-400">Real-time mood analysis generates adaptive backgrounds</p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 space-y-2">
              <div className="text-2xl">✨</div>
              <h4 className="font-semibold text-white">Visual Effects</h4>
              <p className="text-sm text-gray-400">Particle systems and effects react to narration</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6 text-center text-sm text-blue-100">
            <p>
              📖 Upload any EPUB file to get started. Supports all languages and text formats.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
