import type { EmailTransportSettings } from "../types/settings";
import { isValidEmail } from "./validation";
const NUM_120 = 120;
const NUM_65535 = 65_535;

/**
 * Returns whether a persisted outbound email transport configuration is complete enough to send mail.
 *
 * @param settings - Persisted transport settings.
 * @param hasPassword - Whether a secret password is stored alongside the public settings.
 * @returns `true` when the transport can be used for delivery.
 */
export function isEmailTransportConfigured(
  settings: EmailTransportSettings | null | undefined,
  hasPassword: boolean,
): boolean {
  if (!settings) {
    return false;
  }

  const host = settings.host.trim();
  const fromEmail = settings.fromEmail.trim();
  const username = settings.username.trim();
  const port = Math.trunc(settings.port);
  const timeout = Math.trunc(settings.connectionTimeoutSeconds);

  if (host.length === 0 || !isValidEmail(fromEmail)) {
    return false;
  }

  if (!Number.isFinite(port) || port < 1 || port > NUM_65535) {
    return false;
  }

  if (!Number.isFinite(timeout) || timeout < 1 || timeout > NUM_120) {
    return false;
  }

  if (username.length === 0) {
    return !hasPassword;
  }

  return hasPassword;
}
