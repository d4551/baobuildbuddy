/**
 * Script-level defaults for repository automation and verification utilities.
 */

/** Default host for local verification scripts. */
export const DEFAULT_VERIFY_HOST = "127.0.0.1" as const;

/** Default port for local verification scripts. */
export const DEFAULT_VERIFY_PORT = "4105" as const;

/** How long preview server readiness checks are allowed to run. */
export const PREVIEW_READY_TIMEOUT_MS = 60_000 as const;

/** Poll interval for waiting on preview readiness. */
export const PREVIEW_POLL_INTERVAL_MS = 1_000 as const;

/** Maximum preview log lines retained for error reporting. */
export const PREVIEW_LOG_LIMIT = 40 as const;

/** Output separator width for verification summaries. */
export const PREVIEW_SEPARATOR_LENGTH = 72 as const;

/** Maximum allowed timeout for desktop image inspection when detaching. */
export const DISK_IMAGE_TIMEOUT_MS = 60_000 as const;

/** Timeout for PinchTab reachability checks. */
export const PINCHTAB_REQUEST_TIMEOUT_MS = 2_000 as const;

/** Timeout before waiting for PinchTab readiness. */
export const PINCHTAB_READY_TIMEOUT_MS = 15_000 as const;

/** Poll interval while waiting for PinchTab readiness. */
export const PINCHTAB_POLL_INTERVAL_MS = 250 as const;
