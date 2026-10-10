import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('neutralises formula injection but keeps negative numbers', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell(-12.5)).toBe('-12.5');
  });
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });
  it('writes header + rows with dates and nulls', () => {
    expect(toCsv(['a', 'b'], [[new Date('2026-01-01T00:00:00Z'), null]])).toBe('a,b\r\n2026-01-01T00:00:00.000Z,\r\n');
  });
});
