import { useCallback, useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseEpub, ParsedEpub, detectGenre } from '@/lib/epubParser';
import { useNarrationStore } from '@/stores/narrationStore';
import { useSceneStore } from '@/stores/sceneStore';

interface EpubUploaderProps {
  onUploadSuccess?: (epub: ParsedEpub) => void;
  onUploadError?: (error: Error) => void;
}

export default function EpubUploader({ onUploadSuccess, onUploadError }: EpubUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setChapters = useNarrationStore((state) => state.setChapters);
  const updateStoryMemory = useSceneStore((state) => state.updateStoryMemory);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.epub')) {
        const err = new Error('Please select a valid EPUB file');
        setError(err.message);
        onUploadError?.(err);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const parsed = await parseEpub(file);

        // Update narration store with chapters
        setChapters(
          parsed.chapters.map((ch) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
          }))
        );

        // Detect genre and update scene store
        const genre = detectGenre(parsed.metadata, parsed.chapters[0]?.content || '');
        updateStoryMemory({
          location: parsed.metadata.title,
          tone: genre,
          characters: [parsed.metadata.author],
        });

        setSuccess(true);
        onUploadSuccess?.(parsed);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error.message);
        onUploadError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [setChapters, updateStoryMemory, onUploadSuccess, onUploadError]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          onChange={handleInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-muted-foreground" />

          <div>
            <h3 className="font-semibold text-foreground">Upload EPUB File</h3>
            <p className="text-sm text-muted-foreground mt-1">Drag and drop your EPUB file here or click to browse</p>
          </div>

          <Button onClick={handleClick} disabled={isLoading} variant="outline" className="mt-4">
            {isLoading ? 'Processing...' : 'Select File'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">EPUB file uploaded successfully!</p>
        </div>
      )}
    </div>
  );
}
