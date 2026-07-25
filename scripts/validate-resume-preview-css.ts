/**
 * Freshness gate for packages/client/assets/css/resume-preview.generated.css.
 *
 * The generated stylesheet is an SSOT surface derived from
 * RESUME_EXPORT_THEME_CONFIGS. Any hand-edit or stale regeneration is drift:
 * this gate re-renders the expected content and fails on mismatch.
 */

import { readFile } from "node:fs/promises";
import {
  renderResumePreviewCss,
  RESUME_PREVIEW_CSS_PATH,
} from "./generate-resume-preview-css";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const actual = await readFile(RESUME_PREVIEW_CSS_PATH, "utf8");
  const expected = renderResumePreviewCss();
  if (actual === expected) {
    return [];
  }
  return [
    {
      filePath: RESUME_PREVIEW_CSS_PATH,
      line: 1,
      message:
        "Generated resume preview CSS is stale or hand-edited. Run `bun run generate:resume-preview-css` to regenerate from RESUME_EXPORT_THEME_CONFIGS.",
    },
  ];
};

if (import.meta.main) {
  await reportViolations(
    "Resume preview CSS drift detected:",
    await collectViolations(),
    "Resume preview CSS is in sync with RESUME_EXPORT_THEME_CONFIGS.",
  );
}
