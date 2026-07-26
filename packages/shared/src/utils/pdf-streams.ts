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
    chunks.push(
      isZlibCompressed(body) ? inflateSync(body).toString("latin1") : body.toString("latin1"),
    );
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

/** A single drawn text run: the decoded string plus the font size in effect. */
export type PdfTextRun = {
  readonly text: string;
  readonly fontName: string;
  readonly fontSize: number;
};

/** `/Helvetica-Bold-123 18 Tf` selects a font; `<48656C6C6F> Tj` draws hex text. */
const TEXT_OPERATOR_PATTERN = /\/([^\s/]+)\s+([\d.]+)\s+Tf|<([\dA-Fa-f]*)>\s*Tj/gu;
/** Hex string radix used by PDF `<...>` string literals. */
const PDF_HEX_RADIX = 16;
/** Each PDF hex literal character occupies two hex digits. */
const PDF_HEX_PAIR_LENGTH = 2;

const decodePdfHexString = (hex: string): string => {
  let decoded = "";
  for (let index = 0; index + PDF_HEX_PAIR_LENGTH <= hex.length; index += PDF_HEX_PAIR_LENGTH) {
    decoded += String.fromCharCode(
      Number.parseInt(hex.slice(index, index + PDF_HEX_PAIR_LENGTH), PDF_HEX_RADIX),
    );
  }
  return decoded;
};

/**
 * Decode every drawn text run with the font size active when it was drawn.
 * Lets export tests assert rendered geometry (per-layout sizes) rather than
 * colour alone, so a layout constant that is imported but never applied fails.
 */
export const extractPdfTextRuns = (pdfBytes: Uint8Array): PdfTextRun[] => {
  const streams = extractPdfContentStreams(pdfBytes);
  const runs: PdfTextRun[] = [];
  let activeFontName = "";
  let activeFontSize = 0;

  TEXT_OPERATOR_PATTERN.lastIndex = 0;
  for (const match of streams.matchAll(TEXT_OPERATOR_PATTERN)) {
    const [, fontName, fontSize, hexText] = match;
    if (fontName !== undefined && fontSize !== undefined) {
      activeFontName = fontName;
      activeFontSize = Number.parseFloat(fontSize);
      continue;
    }
    if (hexText !== undefined) {
      runs.push({
        text: decodePdfHexString(hexText),
        fontName: activeFontName,
        fontSize: activeFontSize,
      });
    }
  }

  return runs;
};

/** Font size the given text was drawn at, or null when the text is absent. */
export const pdfTextRunFontSize = (pdfBytes: Uint8Array, text: string): number | null =>
  extractPdfTextRuns(pdfBytes).find((run) => run.text === text)?.fontSize ?? null;
