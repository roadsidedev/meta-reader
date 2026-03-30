/**
 * Bookmark management utility for persisting reading positions and notes.
 */

export interface Bookmark {
  id: string;
  chapterId: string;
  chapterTitle: string;
  position: number; // Character index
  timestamp: number; // Unix timestamp
  label: string;
  notes?: string;
}

const BOOKMARKS_KEY = 'storyStage_bookmarks';

/**
 * Get all bookmarks from localStorage.
 */
export function getBookmarks(): Bookmark[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    return [];
  }
}

/**
 * Get bookmarks for a specific chapter.
 */
export function getChapterBookmarks(chapterId: string): Bookmark[] {
  return getBookmarks().filter((b) => b.chapterId === chapterId);
}

/**
 * Add a new bookmark.
 */
export function addBookmark(
  chapterId: string,
  chapterTitle: string,
  position: number,
  label: string,
  notes?: string
): Bookmark {
  const bookmark: Bookmark = {
    id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterId,
    chapterTitle,
    position,
    timestamp: Date.now(),
    label,
    notes,
  };

  const bookmarks = getBookmarks();
  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);

  return bookmark;
}

/**
 * Update an existing bookmark.
 */
export function updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === id);

  if (index === -1) return null;

  bookmarks[index] = { ...bookmarks[index], ...updates };
  saveBookmarks(bookmarks);

  return bookmarks[index];
}

/**
 * Delete a bookmark.
 */
export function deleteBookmark(id: string): boolean {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);

  if (filtered.length === bookmarks.length) return false;

  saveBookmarks(filtered);
  return true;
}

/**
 * Delete all bookmarks for a chapter.
 */
export function deleteChapterBookmarks(chapterId: string): number {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.chapterId !== chapterId);
  const count = bookmarks.length - filtered.length;

  saveBookmarks(filtered);
  return count;
}

/**
 * Save bookmarks to localStorage.
 */
function saveBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
}

/**
 * Export bookmarks as JSON.
 */
export function exportBookmarks(): string {
  const bookmarks = getBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

/**
 * Import bookmarks from JSON.
 */
export function importBookmarks(jsonData: string): number {
  try {
    const imported = JSON.parse(jsonData) as Bookmark[];
    const existing = getBookmarks();

    // Merge, avoiding duplicates by ID
    const merged = [...existing];
    for (const bookmark of imported) {
      if (!merged.find((b) => b.id === bookmark.id)) {
        merged.push(bookmark);
      }
    }

    saveBookmarks(merged);
    return imported.length;
  } catch (error) {
    console.error('Failed to import bookmarks:', error);
    return 0;
  }
}
