/**
 * String utility helpers.
 */

/**
 * Escapes special regex characters in a string for use in RegExp constructors.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
