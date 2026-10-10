export interface PageText {
  page: number | null;
  text: string;
}

/** Normalises extracted text: control chars, hyphenated line breaks, repeated headers/footers, blank-line runs. */
export function cleanPages(pages: PageText[]): PageText[] {
  const basic = pages.map((p) => ({
    page: p.page,
    text: p.text
      .replace(/\r\n?/g, '\n')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/(\w)-\n(\w)/g, '$1$2') // join words hyphenated across lines
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n'),
  }));
  // Drop short lines that repeat on > 50% of pages *at the page edges* (first/last two lines):
  // running headers, footers and page numbers. Body text is never touched.
  if (basic.length >= 3) {
    const key = (l: string) => l.trim().replace(/\d+/g, '#');
    const edges = (text: string) => {
      const lines = text
        .split('\n')
        .map((l, i) => ({ l, i }))
        .filter((x) => x.l.trim().length > 0);
      return [...lines.slice(0, 2), ...lines.slice(-2)].filter((x) => x.l.trim().length <= 80);
    };
    const freq = new Map<string, number>();
    for (const p of basic)
      for (const k of new Set(edges(p.text).map((x) => key(x.l)))) freq.set(k, (freq.get(k) ?? 0) + 1);
    const noisy = new Set([...freq].filter(([, n]) => n / basic.length > 0.5).map(([l]) => l));
    for (const p of basic) {
      const drop = new Set(
        edges(p.text)
          .filter((x) => noisy.has(key(x.l)))
          .map((x) => x.i),
      );
      p.text = p.text
        .split('\n')
        .filter((_, i) => !drop.has(i))
        .join('\n');
    }
  }
  return basic
    .map((p) => ({ page: p.page, text: p.text.replace(/\n{3,}/g, '\n\n').trim() }))
    .filter((p) => p.text.length > 0);
}

/** Cheap metadata extraction used when the uploader didn't supply it. */
export function extractMetadata(text: string): { academicYear?: string } {
  const m = /\b(20\d{2})\s*[-–/]\s*(\d{2}|20\d{2})\b/.exec(text.slice(0, 5000));
  if (!m) return {};
  const start = m[1];
  const end = m[2].length === 2 ? m[2] : m[2].slice(2);
  return { academicYear: `${start}-${end}` };
}
