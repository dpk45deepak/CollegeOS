declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfPageData {
    getTextContent(opts?: unknown): Promise<{ items: { str: string; transform: number[] }[] }>;
  }
  interface PdfOptions {
    pagerender?: (page: PdfPageData) => Promise<string> | string;
    max?: number;
  }
  function pdf(data: Buffer, options?: PdfOptions): Promise<{ numpages: number; text: string }>;
  export default pdf;
}
