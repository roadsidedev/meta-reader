import { useState, useEffect } from 'react';
import { Bookmark, getChapterBookmarks, addBookmark, deleteBookmark, updateBookmark } from '@/lib/bookmarkManager';
import { useNarrationStore } from '@/stores/narrationStore';
import { Button } from '@/components/ui/button';
import { Bookmark as BookmarkIcon, Trash2, Edit2, Check, X } from 'lucide-react';

interface BookmarksPanelProps {
  chapterId: string;
  chapterTitle: string;
  currentPosition: number;
  onBookmarkSelect?: (position: number) => void;
}

/**
 * Bookmarks panel for managing reading positions and notes.
 */
export default function BookmarksPanel({
  chapterId,
  chapterTitle,
  currentPosition,
  onBookmarkSelect,
}: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Load bookmarks
  useEffect(() => {
    const chapterBookmarks = getChapterBookmarks(chapterId);
    setBookmarks(chapterBookmarks.sort((a, b) => a.position - b.position));
  }, [chapterId]);

  const handleAddBookmark = () => {
    const label = `Bookmark ${bookmarks.length + 1}`;
    const newBookmark = addBookmark(chapterId, chapterTitle, currentPosition, label);
    setBookmarks([...bookmarks, newBookmark].sort((a, b) => a.position - b.position));
  };

  const handleDeleteBookmark = (id: string) => {
    if (deleteBookmark(id)) {
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    }
  };

  const handleStartEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
    setEditNotes(bookmark.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    const updated = updateBookmark(id, {
      label: editLabel,
      notes: editNotes,
    });

    if (updated) {
      setBookmarks(bookmarks.map((b) => (b.id === id ? updated : b)));
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
    setEditNotes('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-amber-500" />
          Bookmarks
        </h3>
        <Button
          onClick={handleAddBookmark}
          variant="outline"
          size="sm"
          className="text-amber-500 border-amber-500/50 hover:bg-amber-500/10"
        >
          + Add
        </Button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No bookmarks yet. Add one to save your reading position.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className={`p-3 rounded-lg border transition-colors ${
                editingId === bookmark.id
                  ? 'bg-amber-500/10 border-amber-500'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
              }`}
            >
              {editingId === bookmark.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    placeholder="Bookmark label"
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                    placeholder="Notes"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit(bookmark.id)}
                      variant="ghost"
                      size="sm"
                      className="text-green-500 hover:bg-green-500/20"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => onBookmarkSelect?.(bookmark.position)}
                      className="flex-1 text-left hover:text-amber-400 transition-colors"
                    >
                      <div className="font-medium text-white">{bookmark.label}</div>
                      <div className="text-xs text-gray-400">
                        Position: {bookmark.position} • {new Date(bookmark.timestamp).toLocaleDateString()}
                      </div>
                    </button>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleStartEdit(bookmark)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-amber-500"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {bookmark.notes && (
                    <div className="text-xs text-gray-300 italic">"{bookmark.notes}"</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
