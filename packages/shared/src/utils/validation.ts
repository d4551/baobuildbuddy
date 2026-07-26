/**
 * Shared validation utilities
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function generateId(): string {
  // Bun.randomUUIDv7 is faster and produces monotonic, sortable UUIDs
  // Falls back to crypto.randomUUID for non-Bun environments (shared package)
  return typeof Bun !== "undefined" ? Bun.randomUUIDv7() : crypto.randomUUID();
}
