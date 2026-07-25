/**
 * Shared PDF download assertions — magic header + SSOT RGB fill operators.
 */
import { inflateSync } from "node:zlib";
import { COUNT_FIVE } from "../constants/numeric-literals";
import { writeError, writeOutput } from "./cli-output";

export const PDF_MAGIC = "%PDF-";
export const PDF_MIN_BYTES = 1_000;

const STREAM_BODY_PATTERN = /stream\r?\n([\s\S]*?)\r?\nendstream/g;

export type PdfAssertResult = {
  readonly ok: boolean;
  readonly path: string;
  readonly bytes: number;
  readonly header: string;
};

const extractPdfContentStreams = (pdfBytes: Uint8Array): string => {
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
 * Build a pdf-lib fill operator needle for an RGB triple.
 */
export const pdfRgbFillOperator = (color: {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}): string => `${String(color.r)} ${String(color.g)} ${String(color.b)} rg`;

/**
 * Fail-closed: inflated PDF streams must include the exact SSOT fill operator.
 */
export const assertPdfContainsRgbFill = async (
  path: string,
  color: { readonly r: number; readonly g: number; readonly b: number },
  label: string,
): Promise<boolean> => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    await writeError(`PDF missing for palette assert (${label}): ${path}`);
    return false;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const needle = pdfRgbFillOperator(color);
  const ok = extractPdfContentStreams(buffer).includes(needle);
  await writeOutput(`PDF palette ${label} path=${path} needle=${needle} ok=${String(ok)}`);
  if (!ok) {
    await writeError(`PDF missing expected palette fill (${label}): ${needle}`);
  }
  return ok;
};

/**
 * Validates a downloaded file is a real PDF payload.
 */
export const assertRealPdfFile = async (path: string): Promise<PdfAssertResult> => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    await writeError(`PDF missing: ${path}`);
    return { ok: false, path, bytes: 0, header: "" };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const header = buffer.subarray(0, COUNT_FIVE).toString("utf8");
  const bytes = buffer.byteLength;
  await writeOutput(`PDF path=${path} bytes=${String(bytes)} header=${header}`);
  const ok = header === PDF_MAGIC && bytes >= PDF_MIN_BYTES;
  if (!ok) {
    await writeError("Downloaded file is not a real PDF");
  }
  return { ok, path, bytes, header };
};
