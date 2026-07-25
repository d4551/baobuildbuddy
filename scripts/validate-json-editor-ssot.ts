/**
 * JSON power fields must use AppJsonField / AppCodeEditor — not raw textarea.font-mono.
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const RAW_JSON_TEXTAREA_PATTERN =
  /<textarea\b[^>]*font-mono[^>]*(?:v-model="[^"]*(?:Json|JSON)[^"]*"|v-model="job(?:Provider|Taxonomy)Form)/u;
const RAW_TEXTAREA_FONT_MONO_VMODEL_PATTERN =
  /<textarea[^>]*class="[^"]*font-mono[^"]*"[^>]*v-model="[^"]+"/u;
const SETTINGS_JSON_HINT_PATTERN = /Json|JSON|Boards|Portals|Taxonomy|Themes/u;

export const collectJsonEditorSsotViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    if (file.filePath.includes("AppJsonField.vue") || file.filePath.includes("AppCodeEditor.vue")) {
      continue;
    }
    if (
      RAW_JSON_TEXTAREA_PATTERN.test(file.content) ||
      (file.filePath.includes("settings/") &&
        RAW_TEXTAREA_FONT_MONO_VMODEL_PATTERN.test(file.content) &&
        SETTINGS_JSON_HINT_PATTERN.test(file.content))
    ) {
      violations.push({
        filePath: file.filePath,
        line: 1,
        message:
          "Use AppJsonField/AppCodeEditor for JSON/CSS power editors (no raw textarea.font-mono).",
      });
    }
  }
  return violations;
};

const main = async (): Promise<void> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".vue"]),
  });
  await reportViolations(
    "JSON editor SSOT validation failed:",
    collectJsonEditorSsotViolations(files),
    "JSON editor SSOT validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
