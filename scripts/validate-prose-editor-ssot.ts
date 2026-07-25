/**
 * Long-form non-chat prose fields must use AppProseField — not raw textarea.
 * Chat composers (AI / interview) intentionally keep native textarea (IME + Ctrl+Enter).
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const OWNER_EXEMPT = [
  "AppProseField.vue",
  "AppJsonField.vue",
  "AppCodeEditor.vue",
  "CoverLetterEditorCard.vue",
  "InterviewChat.vue",
  "AIChatConversationPanel.vue",
] as const;

const PROSE_SURFACE_HINT =
  /settings\/|portfolio\/|automation\/email|JobApplyDialog|CoverLetterGenerate|ResumeBuildQuestions|BrandContentTab/u;

const RAW_TEXTAREA_PATTERN = /<textarea\b[^>]*class="[^"]*textarea[^"]*"/u;
const TEXTAREA_OPEN_TAG_PATTERN = /<textarea\b[\s\S]*?>/gu;
const READONLY_ATTR_PATTERN = /\breadonly\b/u;
const READONLY_TEXTAREA_PATTERN = /<textarea\b[^>]*\breadonly\b/u;

export const collectProseEditorSsotViolations = (
  files: Array<{ filePath: string; content: string }>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const file of files) {
    if (OWNER_EXEMPT.some((name) => file.filePath.includes(name))) {
      continue;
    }
    if (!PROSE_SURFACE_HINT.test(file.filePath)) {
      continue;
    }
    // Readonly reply/preview textareas are allowed when marked readonly.
    if (RAW_TEXTAREA_PATTERN.test(file.content) && !READONLY_TEXTAREA_PATTERN.test(file.content)) {
      const textareas = file.content.match(TEXTAREA_OPEN_TAG_PATTERN) ?? [];
      const hasEditable = textareas.some((tag) => !READONLY_ATTR_PATTERN.test(tag));
      if (hasEditable) {
        violations.push({
          filePath: file.filePath,
          line: 1,
          message:
            "Use AppProseField for long-form prose (non-chat). Chat composers exempt.",
        });
      }
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
    "Prose editor SSOT validation failed:",
    collectProseEditorSsotViolations(files),
    "Prose editor SSOT validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
