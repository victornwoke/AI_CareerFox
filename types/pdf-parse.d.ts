declare module "pdf-parse" {
  interface PdfData {
    text: string;
    version: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    pages: { texts: unknown[] }[];
  }

  function pdfParse(data: Buffer | Uint8Array): Promise<PdfData>;
  function pdfParse(data: Buffer | Uint8Array, callback: (err: Error, data: PdfData) => void): void;

  namespace pdfParse {
    export { PdfData };
  }

  export default pdfParse;
}
