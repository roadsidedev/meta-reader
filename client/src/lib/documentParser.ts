import { parseEpub, detectGenre, type Chapter, type EpubMetadata, type ParsedEpub } from './epubParser';

export type { Chapter, EpubMetadata, ParsedEpub };

const CHAPTER_SIZE = 3000; // target chars per chapter for non-structured formats

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

export function parsePlainText(text: string, filename?: string): ParsedEpub {
  const title = filename ? filename.replace(/\.[^.]+$/, '') : 'Pasted Text';
  const metadata: EpubMetadata = { title, author: 'Unknown' };

  // Split into paragraphs, then group into chapters of ~CHAPTER_SIZE chars
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
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
    .replace(/!\[.*?\]\(.*?\)/g, '')           // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // links → text
    .replace(/`{1,3}[^`]*`{1,3}/g, '')         // inline code / code blocks
    .replace(/^```[\s\S]*?```$/gm, '')          // fenced code blocks
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')   // bold/italic
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')     // underscores
    .replace(/^>\s+/gm, '')                     // blockquotes
    .replace(/^[-*+]\s+/gm, '')                // unordered lists
    .replace(/^\d+\.\s+/gm, '')               // ordered lists
    .replace(/^#{1,6}\s+/gm, '')              // remaining headings
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

  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  // Point worker to the bundled worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

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

  // Group pages into chapters (~10 pages each)
  const PAGES_PER_CHAPTER = 10;
  const chapters: Chapter[] = [];
  let order = 0;

  for (let i = 0; i < pageTexts.length; i += PAGES_PER_CHAPTER) {
    const chunk = pageTexts.slice(i, i + PAGES_PER_CHAPTER).join('\n\n');
    const chapterNum = order + 1;
    const startPage = i + 1;
    const endPage = Math.min(i + PAGES_PER_CHAPTER, pageTexts.length);
    const chapterTitle = pageTexts.length <= PAGES_PER_CHAPTER
      ? pdfTitle
      : `Pages ${startPage}–${endPage}`;
    chapters.push(makeChapter(`chapter-${order}`, chapterTitle, chunk, order));
    order++;
    chapterNum; // suppress unused warning
  }

  if (chapters.length === 0) {
    chapters.push(makeChapter('chapter-0', pdfTitle, '(No extractable text found)', 0));
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
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
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

  headingRegex; // suppress unused warning

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
