import * as EPUB from 'epubjs';

export interface Chapter {
  id: string;
  title: string;
  href: string;
  content: string;
  order: number;
}

export interface EpubMetadata {
  title: string;
  author: string;
  genre?: string;
  language?: string;
  cover?: string;
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  chapters: Chapter[];
  toc: Chapter[];
}

/**
 * Parse an EPUB file and extract chapters, metadata, and table of contents.
 * Supports both File objects and ArrayBuffers.
 */
export async function parseEpub(input: File | ArrayBuffer): Promise<ParsedEpub> {
  try {
    const book = new EPUB.Book();

    // Load the EPUB file
    if (input instanceof File) {
      const arrayBuffer = await input.arrayBuffer();
      await book.open(arrayBuffer);
    } else {
      await book.open(input);
    }

    // Extract metadata
    const metadata = await extractMetadata(book);

    // Extract chapters
    const chapters = await extractChapters(book);

    // Extract table of contents
    const toc = await extractTableOfContents(book);

    return {
      metadata,
      chapters,
      toc,
    };
  } catch (error) {
    console.error('Error parsing EPUB:', error);
    throw new Error(`Failed to parse EPUB file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract metadata from EPUB book.
 */
async function extractMetadata(book: EPUB.Book): Promise<EpubMetadata> {
  const metadata = book.packaging.metadata as unknown as Record<string, unknown>;
  const bookAny = book as unknown as Record<string, unknown>;
  const subjectRaw = metadata['subject'];
  const genre = Array.isArray(subjectRaw) ? (subjectRaw[0] as string | undefined) : undefined;

  // book.coverUrl() returns Promise<string|null> — the correct epubjs API
  let cover: string | undefined;
  try {
    if (typeof (bookAny['coverUrl'] as unknown) === 'function') {
      const coverUrl = await (bookAny['coverUrl'] as () => Promise<string | null>)();
      cover = coverUrl ?? undefined;
    }
  } catch {
    // cover unavailable — not critical
  }

  return {
    title: (metadata['title'] as string) || 'Untitled',
    author: (metadata['creator'] as string) || 'Unknown Author',
    genre,
    language: Array.isArray(metadata['language']) ? (metadata['language'][0] as string) : 'en',
    cover,
  };
}

/**
 * Extract all chapters from EPUB book.
 */
async function extractChapters(book: EPUB.Book): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  let order = 0;

  const spineAny = book.spine as unknown as Record<string, unknown>;
  if (!book.spine || !spineAny['spineItems']) {
    return chapters;
  }

  for (const _item of spineAny['spineItems'] as unknown[]) {
    const item = _item as { id?: string; label?: string; href?: string; load: (loader: unknown) => Promise<unknown> };
    try {
      const chapter = await item.load(book.load.bind(book));

      // Extract text content from the chapter
      const content = extractTextContent(chapter);

      chapters.push({
        id: item.id || `chapter-${order}`,
        title: item.label || `Chapter ${order + 1}`,
        href: item.href || '',
        content,
        order,
      });

      order++;
    } catch (error) {
      console.warn(`Error loading chapter ${order}:`, error);
    }
  }

  return chapters;
}

/**
 * Extract table of contents from EPUB book.
 */
async function extractTableOfContents(book: EPUB.Book): Promise<Chapter[]> {
  const toc: Chapter[] = [];

  if (!book.navigation || !book.navigation.toc) {
    return toc;
  }

  let order = 0;
  for (const item of book.navigation.toc) {
    toc.push({
      id: item.id || `toc-${order}`,
      title: item.label || `Section ${order + 1}`,
      href: item.href || '',
      content: '',
      order,
    });
    order++;
  }

  return toc;
}

/**
 * Extract plain text content from an EPUB chapter element.
 */
function extractTextContent(element: any): string {
  if (typeof element === 'string') {
    return element;
  }

  if (!element) {
    return '';
  }

  // If it's a DOM element, extract text
  if (element instanceof Element) {
    return element.textContent || '';
  }

  // If it's a Document, get body text
  if (element instanceof Document) {
    return element.body?.textContent || '';
  }

  // Fallback: convert to string
  return String(element);
}

/**
 * Split chapter content into narration chunks for TTS.
 * Splits on sentence boundaries to maintain readability.
 */
export function splitIntoChunks(text: string, maxChunkLength: number = 500): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  // Split by sentences (simplified regex)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();

    if ((currentChunk + trimmed).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Detect genre from metadata or content analysis.
 * Returns one of: 'fantasy', 'noir', 'romance', 'mystery', 'scifi', 'literary', 'other'
 */
export function detectGenre(metadata: EpubMetadata, content: string): string {
  const genreKeywords: Record<string, string[]> = {
    fantasy: ['dragon', 'magic', 'wizard', 'enchant', 'spell', 'quest', 'realm'],
    noir: ['detective', 'murder', 'crime', 'dark', 'shadow', 'mystery', 'noir'],
    romance: ['love', 'heart', 'romance', 'passion', 'beloved', 'sweetheart'],
    mystery: ['mystery', 'secret', 'clue', 'investigate', 'puzzle', 'unknown'],
    scifi: ['future', 'space', 'robot', 'alien', 'technology', 'sci-fi', 'cyberpunk'],
    literary: ['literary', 'profound', 'existential', 'philosophical'],
  };

  const searchText = `${metadata.title} ${metadata.author} ${metadata.genre || ''} ${content.substring(0, 1000)}`.toLowerCase();

  let bestMatch = 'other';
  let bestScore = 0;

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    const score = keywords.filter((kw) => searchText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = genre;
    }
  }

  return bestMatch;
}
