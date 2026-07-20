/**
 * Ban FilteredEmptyAlert — message-only dead-ends. Use EmptyState + clear/action CTA.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

const FILTERED_EMPTY_ALERT_PATTERN = /\bFilteredEmptyAlert\b/gu;

export const collectFilteredEmptyAlertViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  // Component definition removed — any remaining reference is a violation.
  if (filePath.endsWith("FilteredEmptyAlert.vue")) {
    return [
      {
        filePath,
        line: 1,
        message:
          "FilteredEmptyAlert is banned — delete the component and use EmptyState with clear/action CTA.",
      },
    ];
  }

  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(FILTERED_EMPTY_ALERT_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message:
        "FilteredEmptyAlert is banned — use EmptyState with cta-label-key + @cta/cta-to (clear filters).",
    });
  }
  return violations;
};

const main = async (): Promise<void> => {
  const entries = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  const violations = entries.flatMap((entry) =>
    collectFilteredEmptyAlertViolationsForContent(entry.filePath, entry.content),
  );
  await reportViolations(
    "FilteredEmptyAlert ban validation failed:",
    violations,
    "FilteredEmptyAlert ban validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
