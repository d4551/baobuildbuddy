/**
 * Client error message extraction. Re-exports shared toErrorMessage with API_ERROR_UNEXPECTED as default fallback.
 * Use t("apiErrors.unexpected") or page-specific i18n keys when displaying user-facing fallbacks.
 */
import { API_ERROR_UNEXPECTED, toErrorMessage as sharedToErrorMessage } from "@bao/shared";

/**
 * Extracts a user-facing error message from unknown error values.
 * Supports Error instances, Eden API error shape (Record with message/value.message).
 *
 * @param error - Unknown error (Error, Eden API error, etc.)
 * @param fallback - Fallback when no message can be extracted. Defaults to API_ERROR_UNEXPECTED. Prefer t("apiErrors.unexpected") or page-specific i18n keys.
 */
export function getErrorMessage(error: unknown, fallback = API_ERROR_UNEXPECTED): string {
  return sharedToErrorMessage(error, fallback);
}
