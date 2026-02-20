/**
 * Shared validation utilities
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  if (typeof url !== "string" || url.trim().length === 0) return false;
  return URL.canParse(url);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateId(): string {
  // Bun.randomUUIDv7 is faster and produces monotonic, sortable UUIDs
  // Falls back to crypto.randomUUID for non-Bun environments (shared package)
  return typeof Bun !== "undefined" ? Bun.randomUUIDv7() : crypto.randomUUID();
}
