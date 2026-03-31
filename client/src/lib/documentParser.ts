import { parseEpub, detectGenre, type Chapter, type EpubMetadata, type ParsedEpub } from './epubParser';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type { Chapter, EpubMetadata, ParsedEpub };

const CHAPTER_SIZE = 3000; // target chars per chapter for non-structured formats

// ---------------------------------------------------------------------------
// Intelligent chapter detection
// ---------------------------------------------------------------------------

/**
 * Attempt to split text into chapters by recognising heading patterns common in
 * books and long-form documents:
 *  - "Chapter 1 / Chapter One / Chapter I"  (with optional ": subtitle")
 *  - "CHAPTER 1 / CHAPTER ONE / CHAPTER I"
 *  - "Part 1 / Part One / Part I"
 *  - "Act 1 / Act I / Act One"
 *  - "Book 1 / Book I / Book One"
 *  - Stand-alone named sections: Prologue, Epilogue, Preface, Introduction,
 *    Foreword, Afterword, Interlude, Appendix
 *  - A short (≤60 char) ALL-CAPS line that isn't a sentence fragment
 *
 * Returns an array of { title, content } objects when 2+ headings are found,
 * otherwise returns null so callers can fall back to structural splitting.
 */
function extractChaptersByHeadings(
  text: string,
): { title: string; content: string }[] | null {
  const ROMAN = 'M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})';
  const WORDS_TO_20 =
    'one|two|three|four|five|six|seven|eight|nine|ten|' +
    'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty';

  // Heading pattern: keyword + number/word/roman  +  optional subtitle
  const keywordHeading = new RegExp(
    `^(?:chapter|part|act|book|section|volume)\\s+` +
      `(?:\\d+|${ROMAN}|${WORDS_TO_20})` +
      `(?:\\s*[:\\-–—]\\s*.+)?$`,
    'im',
  );

  // Stand-alone named sections (exact word, optionally followed by a subtitle)
  const namedSection = new RegExp(
    `^(?:prologue|epilogue|preface|introduction|foreword|afterword|interlude|appendix|coda|finale)` +
      `(?:\\s*[:\\-–—]\\s*.+)?$`,
    'im',
  );

  // A line that is entirely upper-case letters/spaces/numbers and short enough
  // to plausibly be a heading (e.g. "THE FIRST MEETING", "PART ONE")
  const allCapsLine = /^[A-Z][A-Z0-9 \t'",.:!?\-–—]{2,59}$/m;

  // Find all heading positions by scanning line by line
  const lines = text.split('\n');
  const headingIndices: { lineIdx: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const isHeading =
      keywordHeading.test(raw) ||
      namedSection.test(raw) ||
      allCapsLine.test(raw);

    if (isHeading) {
      // Require either: it's at the very start, or the previous non-empty line
      // was blank (i.e. heading is its own block)
      const prevNonEmpty = lines
        .slice(0, i)
        .reverse()
        .find((l) => l.trim() !== '');
      if (i === 0 || prevNonEmpty === undefined || lines[i - 1].trim() === '') {
        headingIndices.push({ lineIdx: i, title: raw });
      }
    }
  }

  if (headingIndices.length < 2) return null;

  // Build chapters from the detected heading positions
  const charPositions: number[] = [];
  let charOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    charPositions.push(charOffset);
    charOffset += lines[i].length + 1; // +1 for \n
  }

  const result: { title: string; content: string }[] = [];

  for (let h = 0; h < headingIndices.length; h++) {
    const { lineIdx, title } = headingIndices[h];
    const contentStart = charPositions[lineIdx + 1] ?? charPositions[lineIdx];
    const contentEnd =
      h + 1 < headingIndices.length
        ? charPositions[headingIndices[h + 1].lineIdx]
        : text.length;

    const content = text.slice(contentStart, contentEnd).trim();
    if (content.length > 0) {
      result.push({ title, content });
    }
  }

  // Add any text before the first heading as a preamble chapter
  const firstHeadingStart = charPositions[headingIndices[0].lineIdx];
  const preamble = text.slice(0, firstHeadingStart).trim();
  if (preamble.length > 100) {
    result.unshift({ title: 'Preamble', content: preamble });
  }

  return result.length >= 2 ? result : null;
}

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

export function parsePlainText(text: string, filename?: string): ParsedEpub {
  const title = filename ? filename.replace(/\.[^.]+$/, '') : 'Pasted Text';
  const metadata: EpubMetadata = { title, author: 'Unknown' };

  // Try intelligent chapter detection first
  const detected = extractChaptersByHeadings(text);
  if (detected) {
    const chapters: Chapter[] = detected.map(({ title: chTitle, content }, i) =>
      makeChapter(`chapter-${i}`, chTitle, content, i),
    );
    const genre = detectGenre(metadata, chapters[0]?.content || '');
    metadata.genre = genre;
    return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
  }

  // Fall back: split into paragraphs, then group into chapters of ~CHAPTER_SIZE chars
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chapters: Chapter[] = [];
  let buffer = '';
  let order = 0;

  for (const para of paragraphs) {
    if (buffer.length > 0 && buffer.length + para.length > CHAPTER_SIZE) {
      chapters.push(makeChapter(`chapter-${order}`, `Part ${order + 1}`, buffer.trim(), order));
      order++;
      buffer = para;
    } else {
      buffer += (buffer ? '\n\n' : '') + para;
    }
  }
  if (buffer.trim()) {
    chapters.push(makeChapter(`chapter-${order}`, `Part ${order + 1}`, buffer.trim(), order));
  }

  if (chapters.length === 0) {
    chapters.push(makeChapter('chapter-0', title, text.trim(), 0));
  }

  const genre = detectGenre(metadata, chapters[0]?.content || '');
  metadata.genre = genre;

  return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export async function parseMarkdown(file: File): Promise<ParsedEpub> {
  const text = await file.text();
  const filename = file.name;

  // Extract H1 for title
  const h1Match = text.match(/^#\s+(.+)/m);
  const title = h1Match ? h1Match[1].trim() : filename.replace(/\.[^.]+$/, '');
  const metadata: EpubMetadata = { title, author: 'Unknown' };

  // Split on heading lines (h1-h3)
  const headingRegex = /^(#{1,3})\s+(.+)/m;
  const sections = text.split(/^(?=#{1,3}\s)/m).filter(Boolean);

  let chapters: Chapter[] = [];
  let order = 0;

  if (sections.length <= 1) {
    // No headings — fall back to plain text
    return parsePlainText(stripMarkdown(text), filename);
  }

  for (const section of sections) {
    const firstLine = section.split('\n')[0];
    const headingMatch = firstLine.match(headingRegex);
    const sectionTitle = headingMatch ? headingMatch[2].trim() : `Part ${order + 1}`;
    const body = section.replace(/^#{1,3}\s+.+\n?/, '').trim();
    const content = stripMarkdown(body);
    if (content.length === 0) continue;
    chapters.push(makeChapter(`chapter-${order}`, sectionTitle, content, order));
    order++;
  }

  if (chapters.length === 0) {
    return parsePlainText(stripMarkdown(text), filename);
  }

  const genre = detectGenre(metadata, chapters[0]?.content || '');
  metadata.genre = genre;

  return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline code / code blocks
    .replace(/^```[\s\S]*?```$/gm, '') // fenced code blocks
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // underscores
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/^[-*+]\s+/gm, '') // unordered lists
    .replace(/^\d+\.\s+/gm, '') // ordered lists
    .replace(/^#{1,6}\s+/gm, '') // remaining headings
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function parsePdf(file: File): Promise<ParsedEpub> {
  const filename = file.name;
  const title = filename.replace(/\.[^.]+$/, '');

  const arrayBuffer = await file.arrayBuffer();

  // Point worker to the Vite-bundled worker URL
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Try to get metadata
  let pdfTitle = title;
  let pdfAuthor = 'Unknown';
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, string>;
    if (info['Title']) pdfTitle = info['Title'];
    if (info['Author']) pdfAuthor = info['Author'];
  } catch {
    // metadata unavailable
  }

  const metadata: EpubMetadata = { title: pdfTitle, author: pdfAuthor };

  // Extract text from each page
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  if (pageTexts.length === 0) {
    const chapters = [makeChapter('chapter-0', pdfTitle, '(No extractable text found)', 0)];
    return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
  }

  // Try intelligent chapter detection on the full text
  const fullText = pageTexts.join('\n\n');
  const detected = extractChaptersByHeadings(fullText);
  if (detected) {
    const chapters: Chapter[] = detected.map(({ title: chTitle, content }, i) =>
      makeChapter(`chapter-${i}`, chTitle, content, i),
    );
    const genre = detectGenre(metadata, chapters[0]?.content || '');
    metadata.genre = genre;
    return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
  }

  // Fall back: group pages into chapters (~10 pages each)
  const PAGES_PER_CHAPTER = 10;
  const chapters: Chapter[] = [];
  let order = 0;

  for (let i = 0; i < pageTexts.length; i += PAGES_PER_CHAPTER) {
    const chunk = pageTexts.slice(i, i + PAGES_PER_CHAPTER).join('\n\n');
    const startPage = i + 1;
    const endPage = Math.min(i + PAGES_PER_CHAPTER, pageTexts.length);
    const chapterTitle =
      pageTexts.length <= PAGES_PER_CHAPTER ? pdfTitle : `Pages ${startPage}–${endPage}`;
    chapters.push(makeChapter(`chapter-${order}`, chapterTitle, chunk, order));
    order++;
  }

  const genre = detectGenre(metadata, chapters[0]?.content || '');
  metadata.genre = genre;

  return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
}

// ---------------------------------------------------------------------------
// Word (.docx)
// ---------------------------------------------------------------------------

export async function parseWord(file: File): Promise<ParsedEpub> {
  const filename = file.name;
  const title = filename.replace(/\.[^.]+$/, '');
  const metadata: EpubMetadata = { title, author: 'Unknown' };

  const arrayBuffer = await file.arrayBuffer();

  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Split on heading tags
  const parts = html.split(/(?=<h[1-3][\s>])/i).filter(Boolean);

  let chapters: Chapter[] = [];
  let order = 0;

  if (parts.length <= 1) {
    // No headings — strip all HTML and fall back to plain text
    return parsePlainText(stripHtml(html), filename);
  }

  for (const part of parts) {
    const headingMatch = part.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const sectionTitle = headingMatch ? stripHtml(headingMatch[1]).trim() : `Part ${order + 1}`;
    const bodyHtml = part.replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/i, '');
    const content = stripHtml(bodyHtml).trim();
    if (content.length === 0) continue;
    chapters.push(makeChapter(`chapter-${order}`, sectionTitle, content, order));
    order++;
  }

  if (chapters.length === 0) {
    return parsePlainText(stripHtml(html), filename);
  }

  const genre = detectGenre(metadata, chapters[0]?.content || '');
  metadata.genre = genre;

  return { metadata, chapters, toc: chapters.map((c) => ({ ...c, content: '' })) };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = new Set(['.epub', '.md', '.markdown', '.pdf', '.docx', '.doc', '.txt']);

export function isSupportedFile(file: File): boolean {
  const ext = getExtension(file.name);
  return SUPPORTED_EXTENSIONS.has(ext);
}

export async function parseDocument(file: File): Promise<ParsedEpub> {
  const ext = getExtension(file.name);

  switch (ext) {
    case '.epub':
      return parseEpub(file);
    case '.md':
    case '.markdown':
      return parseMarkdown(file);
    case '.pdf':
      return parsePdf(file);
    case '.docx':
    case '.doc':
      return parseWord(file);
    case '.txt':
      return parsePlainText(await file.text(), file.name);
    default:
      throw new Error(`Unsupported file type: ${ext || 'unknown'}. Please use EPUB, MD, PDF, DOCX, or TXT.`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtension(filename: string): string {
  const match = filename.toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function makeChapter(id: string, title: string, content: string, order: number): Chapter {
  return { id, title, href: '', content, order };
}
