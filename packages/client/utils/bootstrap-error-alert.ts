/** Retry control is honest only when both visible label and aria label are present. */
export const hasBootstrapErrorRetry = (
  retryLabel: string | undefined,
  retryAriaLabel: string | undefined,
): boolean =>
  (retryLabel?.trim().length ?? 0) > 0 && (retryAriaLabel?.trim().length ?? 0) > 0;
