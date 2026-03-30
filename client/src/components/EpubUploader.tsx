import { useCallback, useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseDocument, parsePlainText, isSupportedFile, type ParsedEpub } from '@/lib/documentParser';
import { detectGenre } from '@/lib/epubParser';
import { useNarrationStore } from '@/stores/narrationStore';
import { useSceneStore } from '@/stores/sceneStore';

interface EpubUploaderProps {
  onUploadSuccess?: (epub: ParsedEpub) => void;
  onUploadError?: (error: Error) => void;
}

type Tab = 'file' | 'paste';

const ACCEPT = '.epub,.md,.markdown,.pdf,.docx,.doc,.txt';

export default function EpubUploader({ onUploadSuccess, onUploadError }: EpubUploaderProps) {
  const [tab, setTab] = useState<Tab>('file');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setChapters = useNarrationStore((state) => state.setChapters);
  const updateStoryMemory = useSceneStore((state) => state.updateStoryMemory);

  const handleParsed = useCallback(
    (parsed: ParsedEpub) => {
      setChapters(
        parsed.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
        }))
      );

      const genre = detectGenre(parsed.metadata, parsed.chapters[0]?.content || '');
      updateStoryMemory({
        location: parsed.metadata.title,
        tone: genre,
        characters: [parsed.metadata.author],
      });

      setSuccess(true);
      onUploadSuccess?.(parsed);
      setTimeout(() => setSuccess(false), 3000);
    },
    [setChapters, updateStoryMemory, onUploadSuccess]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!isSupportedFile(file)) {
        const err = new Error(
          'Unsupported file type. Please use EPUB, PDF, DOCX, MD, or TXT.'
        );
        setError(err.message);
        onUploadError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const parsed = await parseDocument(file);
        handleParsed(parsed);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        onUploadError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleParsed, onUploadError]
  );

  const handlePasteSubmit = useCallback(async () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setError('Please paste some text first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const parsed = parsePlainText(trimmed);
      handleParsed(parsed);
      setPasteText('');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onUploadError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [pasteText, handleParsed, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-700/50 p-1 mb-4">
        <button
          onClick={() => setTab('file')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            tab === 'file'
              ? 'bg-slate-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
        <button
          onClick={() => setTab('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            tab === 'paste'
              ? 'bg-slate-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          Paste Text
        </button>
      </div>

      {/* File upload panel */}
      {tab === 'file' && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-foreground">Upload a Document</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                EPUB · PDF · DOCX · Markdown · TXT
              </p>
            </div>
            <Button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={isLoading}
              variant="outline"
              className="mt-2"
            >
              {isLoading ? 'Processing…' : 'Select File'}
            </Button>
          </div>
        </div>
      )}

      {/* Paste panel */}
      {tab === 'paste' && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 space-y-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <ClipboardPaste className="w-10 h-10 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Paste Your Text</h3>
            <p className="text-sm text-muted-foreground">Paste any text — articles, stories, notes, scripts</p>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your text here…"
            rows={8}
            disabled={isLoading}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y disabled:opacity-50"
          />
          <Button
            onClick={handlePasteSubmit}
            disabled={isLoading || !pasteText.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? 'Processing…' : 'Load Text'}
          </Button>
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">Document loaded successfully!</p>
        </div>
      )}
    </div>
  );
}
