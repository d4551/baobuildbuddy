/**
 * Inflate PDF content streams for palette assertions (pdf-lib uses FlateDecode).
 */
import { inflateSync } from "node:zlib";

const STREAM_BODY_PATTERN = /stream\r?\n([\s\S]*?)\r?\nendstream/g;

/**
 * Decode all PDF stream bodies (inflated when compressed) into one latin1 string.
 */
export const extractPdfContentStreams = (pdfBytes: Uint8Array): string => {
  const source = Buffer.from(pdfBytes).toString("latin1");
  const chunks: string[] = [];
  for (const match of source.matchAll(STREAM_BODY_PATTERN)) {
    const body = Buffer.from(match[1] ?? "", "latin1");
    try {
      chunks.push(inflateSync(body).toString("latin1"));
    } catch {
      chunks.push(body.toString("latin1"));
    }
  }
  return chunks.join("\n");
};

/**
 * Build a pdf-lib fill operator needle for an RGB triple (e.g. "0.62 0.18 0.42 rg").
 */
export const pdfRgbFillOperator = (color: {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}): string => `${String(color.r)} ${String(color.g)} ${String(color.b)} rg`;

/**
 * True when inflated PDF streams include the exact fill operator for the color.
 */
export const pdfStreamsContainRgbFill = (
  pdfBytes: Uint8Array,
  color: { readonly r: number; readonly g: number; readonly b: number },
): boolean => extractPdfContentStreams(pdfBytes).includes(pdfRgbFillOperator(color));
