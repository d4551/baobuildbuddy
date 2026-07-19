export const DEFAULT_HOST = "0.0.0.0" as const;
export const DEFAULT_LOG_LEVEL = "info" as const;
export const LOOPBACK_HOST = "localhost" as const;
export const LOOPBACK_HOST_IPV4 = "127.0.0.1" as const;
export const LOOPBACK_HOST_IPV6 = "::1" as const;

/** HTTP header name for trace correlation IDs. */
export const TRACE_ID_HEADER = "x-trace-id" as const;
/** Number of random bytes used to generate a trace ID (encoded as hex). */
export const TRACE_ID_BYTE_LENGTH = 16;
