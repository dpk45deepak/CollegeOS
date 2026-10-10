import { chunkPages } from './chunker';
import { cleanPages, extractMetadata } from './text-cleaner';

const para = (n: number, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ') + '.';

describe('chunker', () => {
  it('keeps chunks near the target size and never empty', () => {
    const text = Array.from({ length: 30 }, (_, i) => para(60, `p${i}x`)).join('\n\n');
    const chunks = chunkPages([{ page: 1, text }], { targetChars: 1000, overlapChars: 100, minChars: 50 });
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) {
      expect(c.content.length).toBeGreaterThan(0);
      expect(c.content.length).toBeLessThan(1400);
    }
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
  });
  it('overlaps consecutive chunks', () => {
    const text = Array.from({ length: 12 }, (_, i) => para(50, `s${i}_`)).join('\n\n');
    const [a, b] = chunkPages([{ page: 1, text }], { targetChars: 800, overlapChars: 120, minChars: 50 });
    const tail = a.content.slice(-60);
    expect(b.content.includes(tail.split(' ').slice(-3).join(' '))).toBe(true);
  });
  it('records the page where a chunk starts', () => {
    const chunks = chunkPages(
      [
        { page: 11, text: para(300, 'a') },
        { page: 12, text: para(300, 'b') },
      ],
      { targetChars: 1500, overlapChars: 0, minChars: 50 },
    );
    expect(chunks[0].pageNumber).toBe(11);
    expect(chunks.some((c) => c.pageNumber === 12)).toBe(true);
  });
  it('splits a giant unpunctuated paragraph instead of looping forever', () => {
    const chunks = chunkPages([{ page: null, text: 'x'.repeat(10_000) }], {
      targetChars: 1000,
      overlapChars: 0,
      minChars: 10,
    });
    expect(chunks.length).toBeGreaterThanOrEqual(10);
  });
  it('returns nothing for empty input', () => {
    expect(chunkPages([])).toEqual([]);
  });
});

describe('cleaner', () => {
  it('joins hyphenated words and removes repeated running headers/page numbers', () => {
    const pages = [1, 2, 3, 4].map((n) => ({
      page: n,
      text: `SDCET Attendance Policy\nPage ${n}\nThe minimum atten-\ndance is 75 percent in n${n}.\nStudents below it cannot sit exams.\nSee section ${n}.\nSDCET Confidential`,
    }));
    const out = cleanPages(pages);
    expect(out[0].text).toContain('attendance is 75 percent');
    expect(out[0].text).not.toContain('SDCET Attendance Policy');
    expect(out[0].text).not.toContain('Page 1');
  });
  it('extracts an academic year', () => {
    expect(extractMetadata('Attendance Policy for Academic Year 2025-26')).toEqual({ academicYear: '2025-26' });
    expect(extractMetadata('no dates here')).toEqual({});
  });
});
