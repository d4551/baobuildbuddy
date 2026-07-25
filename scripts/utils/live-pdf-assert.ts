/**
 * Shared PDF download assertions — magic header + minimum size.
 */
import { COUNT_FIVE } from "../constants/numeric-literals";
import { writeError, writeOutput } from "./cli-output";

export const PDF_MAGIC = "%PDF-";
export const PDF_MIN_BYTES = 1_000;

export type PdfAssertResult = {
  readonly ok: boolean;
  readonly path: string;
  readonly bytes: number;
  readonly header: string;
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
