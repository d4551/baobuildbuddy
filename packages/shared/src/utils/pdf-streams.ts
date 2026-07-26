/**
 * PDF content-stream decoding utilities.
 * Canonical owner for stream inflation used by export theme tests (server)
 * and live PDF assertion helpers (scripts). pdf-lib writes FlateDecode
 * (RFC 1950 zlib) streams; uncompressed streams pass through raw.
 */
import { inflateSync } from "node:zlib";

const STREAM_BODY_PATTERN = /stream\r?\n([\s\S]*?)\r?\nendstream/g;

/** RFC 1950 zlib CMF byte: deflate, 32 KiB window. */
const ZLIB_CMF = 0x78;
/** RFC 1950 FCHECK: (CMF * 256 + FLG) must be a multiple of 31. */
const ZLIB_FCHECK_MODULUS = 31;
/** CMF/FLG are packed big-endian into a 16-bit header word. */
const HEADER_BYTE_RADIX = 256;

/**
 * True when the stream body carries a valid RFC 1950 zlib header.
 * Sniffing replaces a throw-probe: only header-valid bodies are inflated.
 */
export const isZlibCompressed = (body: Buffer): boolean =>
  body.length > 1 &&
  body[0] === ZLIB_CMF &&
  (body[0] * HEADER_BYTE_RADIX + body[1]) % ZLIB_FCHECK_MODULUS === 0;

/**
 * Decode all PDF stream bodies (inflated when compressed) into one latin1 string.
 */
export const extractPdfContentStreams = (pdfBytes: Uint8Array): string => {
  const source = Buffer.from(pdfBytes).toString("latin1");
  const chunks: string[] = [];
  for (const match of source.matchAll(STREAM_BODY_PATTERN)) {
    const body = Buffer.from(match[1] ?? "", "latin1");
    chunks.push(isZlibCompressed(body) ? inflateSync(body).toString("latin1") : body.toString("latin1"));
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
