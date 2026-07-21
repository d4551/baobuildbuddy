/**
 * UI SSOT authority paths — the only files allowed to define design-token literals.
 * Binding: docs/STACK-CONTRACT.md (constants + CSS, not .bao archives).
 */

export const UI_SSOT_AUTHORITY_PATHS = new Set<string>([
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-shell.ts",
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/ui-layout.ts",
  "packages/client/constants/chat.ts",
  "packages/client/assets/css/main.css",
]);

export const isUiSsotAuthority = (filePath: string): boolean =>
  UI_SSOT_AUTHORITY_PATHS.has(filePath);
