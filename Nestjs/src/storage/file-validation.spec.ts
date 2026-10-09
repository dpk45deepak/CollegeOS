import { detectFileType, safeName, validateUpload } from './file-validation';

describe('file validation', () => {
  const pdf = Buffer.from('%PDF-1.7\n...');
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

  it('detects types from bytes', () => {
    expect(detectFileType(pdf)?.ext).toBe('pdf');
    expect(detectFileType(png)?.ext).toBe('png');
    expect(detectFileType(Buffer.from('hello world, plain text'))?.ext).toBe('txt');
  });
  it('rejects executables even if renamed .pdf', () => {
    expect(detectFileType(exe)).toBeNull();
    expect(() => validateUpload(exe, ['pdf'], 1000)).toThrow();
  });
  it('rejects disallowed types and oversize files', () => {
    expect(() => validateUpload(png, ['pdf'], 1000)).toThrow(/Unsupported/);
    expect(() => validateUpload(Buffer.alloc(2000, 0x41), ['txt'], 1000)).toThrow(/exceeds/);
  });
  it('rejects arbitrary zip archives, accepts OOXML', () => {
    expect(detectFileType(Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.from('evil.sh')]))).toBeNull();
    expect(
      detectFileType(Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.from('word/document.xml')]))?.ext,
    ).toBe('docx');
  });
  it('sanitises filenames', () => {
    expect(safeName('../../etc/passwd')).not.toContain('/');
  });
});
