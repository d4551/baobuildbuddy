/**
 * Network port defaults and bounds used across server and client runtime configuration.
 */

/** Default backend server port for local and dev environments. */
export const DEFAULT_SERVER_PORT = 3000 as const;

/** Default Nuxt client dev port when running separately from the backend. */
export const DEFAULT_CLIENT_DEV_PORT = 3001 as const;

/** Default PinchTab browser automation server port. */
export const DEFAULT_PINCHTAB_PORT = 9867 as const;

/** Inclusive minimum allowed port number. */
export const MIN_PORT = 1 as const;

/** Inclusive maximum allowed port number. */
export const MAX_PORT = 65_535 as const;
