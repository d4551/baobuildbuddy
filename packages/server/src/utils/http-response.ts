/**
 * Canonical HTTP header key for response content type.
 */
export const HEADER_CONTENT_TYPE = "content-type";

/**
 * Canonical HTTP header key for attachment disposition metadata.
 */
export const HEADER_CONTENT_DISPOSITION = "content-disposition";

/**
 * Canonical HTTP header key controlling downstream caching.
 */
export const HEADER_CACHE_CONTROL = "cache-control";

/**
 * Canonical PDF content-type value used by binary export endpoints.
 */
export const MIME_TYPE_PDF = "application/pdf";

/**
 * Canonical DOCX content-type value used by Word document export endpoints.
 */
import { MIME_TYPE_DOCX } from "@bao/shared";

export { MIME_TYPE_DOCX };

/**
 * Canonical generic binary content-type fallback value.
 */
export const MIME_TYPE_OCTET_STREAM = "application/octet-stream";

/**
 * Canonical cache-control directive used for private, non-cacheable payloads.
 */
export const CACHE_CONTROL_PRIVATE_NO_STORE = "private, no-store, no-cache";

/**
 * Binary payload shape used by response helpers.
 */
export type BinaryPayload = ArrayBuffer | Uint8Array;

const normalizeBinaryPayload = (payload: BinaryPayload): ArrayBuffer => {
  if (payload instanceof ArrayBuffer) {
    return payload;
  }

  const normalized = new Uint8Array(payload.byteLength);
  normalized.set(payload);
  return normalized.buffer;
};

/**
 * Builds a safe attachment disposition header value for a file name.
 */
export const createAttachmentDisposition = (fileName: string): string =>
  `attachment; filename="${fileName}"`;

/**
 * Creates canonical headers for a PDF attachment response.
 */
export const createPdfAttachmentHeaders = (fileName: string): Readonly<Record<string, string>> => ({
  [HEADER_CONTENT_TYPE]: MIME_TYPE_PDF,
  [HEADER_CONTENT_DISPOSITION]: createAttachmentDisposition(fileName),
});

/**
 * Creates a binary PDF attachment response with canonical headers.
 */
export const createPdfAttachmentResponse = (payload: BinaryPayload, fileName: string): Response =>
  new Response(new Blob([normalizeBinaryPayload(payload)]), {
    headers: createPdfAttachmentHeaders(fileName),
  });

/**
 * Creates canonical headers for a DOCX attachment response.
 */
export const createDocxAttachmentHeaders = (
  fileName: string,
): Readonly<Record<string, string>> => ({
  [HEADER_CONTENT_TYPE]: MIME_TYPE_DOCX,
  [HEADER_CONTENT_DISPOSITION]: createAttachmentDisposition(fileName),
});

/**
 * Creates a binary DOCX attachment response with canonical headers.
 */
export const createDocxAttachmentResponse = (payload: BinaryPayload, fileName: string): Response =>
  new Response(new Blob([normalizeBinaryPayload(payload)]), {
    headers: createDocxAttachmentHeaders(fileName),
  });

/**
 * Creates a binary response with optional cache-control metadata.
 */
export const createBinaryResponse = (
  payload: BinaryPayload,
  options: {
    contentType: string;
    cacheControl?: string;
  },
): Response => {
  const headers: Record<string, string> = {
    [HEADER_CONTENT_TYPE]: options.contentType,
  };

  if (options.cacheControl) {
    headers[HEADER_CACHE_CONTROL] = options.cacheControl;
  }

  return new Response(new Blob([normalizeBinaryPayload(payload)]), {
    headers,
  });
};
