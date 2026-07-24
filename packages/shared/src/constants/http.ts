/**
 * Canonical HTTP status codes used across API routes and error handling.
 * Single source of truth for status values.
 */
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_CREATED = 201;
/** First 3xx status — exclusive upper bound for 2xx success checks. */
export const HTTP_STATUS_MULTIPLE_CHOICES = 300;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_FORBIDDEN = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_CONFLICT = 409;
export const HTTP_STATUS_GONE = 410;
export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_BAD_GATEWAY = 502;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;
