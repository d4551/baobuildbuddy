/**
 * UI SSOT authority paths — the only files allowed to define design-token literals.
 * Binding: docs/STACK-CONTRACT.md (constants + CSS, not .bao archives).
 */

export const UI_SSOT_AUTHORITY_PATHS = new Set<string>([
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-chrome.ts",
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/layout-shell.ts",
  "packages/client/constants/layout-tokens-actions.ts",
  "packages/client/constants/layout-badges.ts",
  "packages/client/constants/layout-action-soft.ts",
  "packages/client/constants/layout-public-extras.ts",
  "packages/client/constants/ui-layout.ts",
  "packages/client/constants/chat.ts",
  "packages/client/assets/css/main.css",
  // Generated from RESUME_EXPORT_THEME_CONFIGS; drift locked by validate:resume-preview-css.
  "packages/client/assets/css/resume-preview.generated.css",
]);

export const isUiSsotAuthority = (filePath: string): boolean =>
  UI_SSOT_AUTHORITY_PATHS.has(filePath);
