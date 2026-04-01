/**
 * Canonical HTTP header key for response content type.
 */
export declare const HEADER_CONTENT_TYPE = "content-type";
/**
 * Canonical HTTP header key for attachment disposition metadata.
 */
export declare const HEADER_CONTENT_DISPOSITION = "content-disposition";
/**
 * Canonical HTTP header key controlling downstream caching.
 */
export declare const HEADER_CACHE_CONTROL = "cache-control";
/**
 * Canonical PDF content-type value used by binary export endpoints.
 */
export declare const MIME_TYPE_PDF = "application/pdf";
/**
 * Canonical DOCX content-type value used by Word document export endpoints.
 */
import { MIME_TYPE_DOCX } from "@bao/shared/constants/export-layout";
export { MIME_TYPE_DOCX };
/**
 * Canonical generic binary content-type fallback value.
 */
export declare const MIME_TYPE_OCTET_STREAM = "application/octet-stream";
/**
 * Canonical cache-control directive used for private, non-cacheable payloads.
 */
export declare const CACHE_CONTROL_PRIVATE_NO_STORE = "private, no-store, no-cache";
/**
 * Binary payload shape used by response helpers.
 */
export type BinaryPayload = ArrayBuffer | Uint8Array;
/**
 * Builds a safe attachment disposition header value for a file name.
 */
export declare const createAttachmentDisposition: (fileName: string) => string;
/**
 * Creates canonical headers for a PDF attachment response.
 */
export declare const createPdfAttachmentHeaders: (fileName: string) => Readonly<Record<string, string>>;
/**
 * Creates a binary PDF attachment response with canonical headers.
 */
export declare const createPdfAttachmentResponse: (payload: BinaryPayload, fileName: string) => Response;
/**
 * Creates canonical headers for a DOCX attachment response.
 */
export declare const createDocxAttachmentHeaders: (fileName: string) => Readonly<Record<string, string>>;
/**
 * Creates a binary DOCX attachment response with canonical headers.
 */
export declare const createDocxAttachmentResponse: (payload: BinaryPayload, fileName: string) => Response;
/**
 * Creates a binary response with optional cache-control metadata.
 */
export declare const createBinaryResponse: (payload: BinaryPayload, options: {
    contentType: string;
    cacheControl?: string;
}) => Response;
