import { PageText } from './text-cleaner';

export interface ChunkOptions {
  targetChars: number;
  overlapChars: number;
  minChars: number;
}
export interface Chunk {
  index: number;
  content: string;
  pageNumber: number | null;
  tokenCount: number;
}
export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = { targetChars: 1800, overlapChars: 250, minChars: 120 };

const approxTokens = (s: string) => Math.ceil(s.length / 4);

function splitLong(paragraph: string, max: number): string[] {
  if (paragraph.length <= max) return [paragraph];
  const sentences = paragraph.match(/[^.!?\n]+[.!?]+["')\]]?\s*|[^.!?\n]+$/g) ?? [paragraph];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) {
      out.push(cur.trim());
      cur = '';
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
      continue;
    } // pathological: no punctuation
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Tail of a chunk, cut at a word boundary, to carry context into the next chunk. */
function overlapTail(text: string, n: number): string {
  if (n <= 0 || text.length <= n) return n <= 0 ? '' : text;
  const tail = text.slice(-n);
  const sp = tail.indexOf(' ');
  return sp > 0 ? tail.slice(sp + 1) : tail;
}

/**
 * Paragraph-aware chunking with overlap. Each chunk records the page of its first paragraph so answers can
 * cite "Attendance Policy — Page 12".
 */
export function chunkPages(pages: PageText[], opts: ChunkOptions = DEFAULT_CHUNK_OPTIONS): Chunk[] {
  const chunks: Chunk[] = [];
  let buf = '';
  let bufPage: number | null = null;
  const flush = () => {
    const content = buf.trim();
    if (content.length >= opts.minChars || (content.length > 0 && chunks.length === 0)) {
      chunks.push({ index: chunks.length, content, pageNumber: bufPage, tokenCount: approxTokens(content) });
    } else if (content.length > 0 && chunks.length > 0) {
      chunks[chunks.length - 1].content += `\n\n${content}`; // fold a tiny tail into the previous chunk
      chunks[chunks.length - 1].tokenCount = approxTokens(chunks[chunks.length - 1].content);
    }
  };
  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n{2,}/)
      .flatMap((p) => splitLong(p.trim(), opts.targetChars))
      .filter(Boolean);
    for (const para of paragraphs) {
      if (buf && buf.length + para.length + 2 > opts.targetChars) {
        const tail = overlapTail(buf, opts.overlapChars);
        flush();
        buf = tail;
        bufPage = page.page;
      }
      if (!buf) bufPage = page.page;
      buf += (buf ? '\n\n' : '') + para;
    }
  }
  flush();
  return chunks.map((c, i) => ({ ...c, index: i }));
}
