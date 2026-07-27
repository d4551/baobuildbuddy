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
  // Stylesheet modules composed by main.css. tokens.css is the only one permitted
  // raw design-token values; the rest consume it via var().
  "packages/client/assets/css/main.css",
  "packages/client/assets/css/tokens.css",
  "packages/client/assets/css/theme-base.css",
  "packages/client/assets/css/glass.css",
  "packages/client/assets/css/motion.css",
  "packages/client/assets/css/theme-a11y-preferences.css",
  "packages/client/assets/css/theme-shell.css",
  // Generated from RESUME_EXPORT_THEME_CONFIGS; drift locked by validate:resume-preview-css.
  "packages/client/assets/css/tokens-resume-preview.generated.css",
]);

export const isUiSsotAuthority = (filePath: string): boolean =>
  UI_SSOT_AUTHORITY_PATHS.has(filePath);
