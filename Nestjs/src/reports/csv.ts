/**
 * CSV writer with spreadsheet-injection protection: cells starting with = + - @ (or tab/CR) are prefixed with an
 * apostrophe so Excel/Sheets never evaluate them as formulas.
 */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(columns: string[], rows: unknown[][]): string {
  return [columns.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\r\n') + '\r\n';
}

/** PDF-ready: implement `Renderer` with pdfkit/puppeteer and register it in ReportsModule; CSV is the default. */
export interface ReportRenderer {
  readonly contentType: string;
  readonly extension: string;
  render(title: string, columns: string[], rows: unknown[][]): Buffer;
}
export const csvRenderer: ReportRenderer = {
  contentType: 'text/csv; charset=utf-8',
  extension: 'csv',
  render: (_t, c, r) => Buffer.from('\ufeff' + toCsv(c, r), 'utf8'),
};
