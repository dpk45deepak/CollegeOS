import { BadRequestException } from '@nestjs/common';
import { PageText } from './text-cleaner';

/** Turns an uploaded file into per-page text (page numbers feed citations). */
export async function extractPages(
  buf: Buffer,
  mime: string,
): Promise<{ pages: PageText[]; pageCount: number | null }> {
  if (mime === 'application/pdf') {
    // Import the library core directly: the package index runs a debug routine when not required by a parent module.
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    const pages: PageText[] = [];
    const res = await pdf(buf, {
      pagerender: async (page) => {
        const tc = await page.getTextContent();
        let lastY: number | undefined;
        let text = '';
        for (const item of tc.items) {
          const y = item.transform[5];
          text += lastY === undefined || Math.abs(y - lastY) < 2 ? item.str : `\n${item.str}`;
          lastY = y;
        }
        pages.push({ page: pages.length + 1, text });
        return text;
      },
    });
    return { pages, pageCount: res.numpages };
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return { pages: [{ page: null, text: value }], pageCount: null };
  }
  if (mime.startsWith('text/')) return { pages: [{ page: null, text: buf.toString('utf8') }], pageCount: null };
  throw new BadRequestException(`Cannot extract text from ${mime}`);
}
