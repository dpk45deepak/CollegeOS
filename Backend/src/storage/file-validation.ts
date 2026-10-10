import { BadRequestException } from '@nestjs/common';

export interface DetectedFile {
  mime: string;
  ext: string;
}

const startsWith = (b: Buffer, sig: number[], off = 0) => sig.every((v, i) => b[off + i] === v);

/** Content-sniffing: we trust the bytes, never the client-supplied mimetype or extension. */
export function detectFileType(b: Buffer): DetectedFile | null {
  if (b.length < 4) return null;
  if (startsWith(b, [0x25, 0x50, 0x44, 0x46])) return { mime: 'application/pdf', ext: 'pdf' };
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47])) return { mime: 'image/png', ext: 'png' };
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) {
    // zip container: accept only OOXML documents (word/ directory marker present)
    const head = b.subarray(0, Math.min(b.length, 4096)).toString('latin1');
    if (head.includes('word/') || head.includes('[Content_Types].xml')) {
      return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
    }
    return null;
  }
  // plain text / markdown: no NUL bytes and valid UTF-8 in the sampled prefix
  const sample = b.subarray(0, Math.min(b.length, 8192));
  if (!sample.includes(0)) {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(sample);
      return { mime: 'text/plain', ext: 'txt' };
    } catch {
      return null;
    }
  }
  return null;
}

export function validateUpload(buf: Buffer, allowedExts: string[], maxBytes: number): DetectedFile {
  if (buf.length === 0) throw new BadRequestException('Empty file');
  if (buf.length > maxBytes)
    throw new BadRequestException({
      message: `File exceeds ${Math.round(maxBytes / 1048576)} MB`,
      errorCode: 'FILE_TOO_LARGE',
    });
  const detected = detectFileType(buf);
  if (!detected || !allowedExts.includes(detected.ext)) {
    throw new BadRequestException({
      message: `Unsupported file type. Allowed: ${allowedExts.join(', ')}`,
      errorCode: 'FILE_TYPE_NOT_ALLOWED',
    });
  }
  return detected;
}

export function safeName(name: string): string {
  return (
    name
      .replace(/[^\w.\- ]+/g, '_')
      .replace(/\.{2,}/g, '.')
      .slice(0, 100) || 'file'
  );
}
