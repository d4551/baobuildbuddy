/**
 * Canonical loopback / RFC 1918 / link-local host classification.
 *
 * Single owner for the SSRF host policy: the server's job-apply URL gate
 * delegates here so the range boundaries exist in exactly one place.
 */

/**
 * Hostname forms that are always private. Covers loopback, the three RFC 1918
 * blocks, the 169.254.0.0/16 link-local range used by cloud metadata
 * endpoints, and the IPv6 loopback / unique-local prefixes.
 *
 * The 172 pattern deliberately spells out `1[6-9]|2\d|3[01]`: the block is
 * 172.16–172.31, so a looser `^172\.` would refuse public space and a tighter
 * one would let real private hosts through.
 */
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^localhost\.localdomain$/i,
  /\.localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/i,
  /^fc[0-9a-f]+/i,
  /^fd[0-9a-f]+/i,
  /^fe80/i,
  /\.internal$/i,
] as const;

/**
 * True when a URL hostname is loopback, RFC 1918 private space, or link-local.
 * Used to fail closed before posting candidate PII to automation targets.
 * An empty hostname is treated as private so callers fail closed.
 *
 * @param rawHostname Hostname taken from a parsed URL.
 * @returns Whether the host must be refused unless private hosts are opted in.
 */
export const isLoopbackOrPrivateHost = (rawHostname: string): boolean => {
  const hostname = rawHostname.trim().toLowerCase();
  if (hostname.length === 0) {
    return true;
  }

  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
};
