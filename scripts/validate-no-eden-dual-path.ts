/**
 * Ban requestApi + API_ENDPOINTS.* once Eden ClientApi owns the branch.
 * Softening ban: typed Eden fabric must be the sole HTTP path for owned prefixes.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const allowedExtensions = new Set([".vue", ".ts"]);

/** Eden-owned prefixes — requestApi(API_ENDPOINTS.<prefix>*) is banned. */
const EDEN_OWNED_ENDPOINT_PREFIXES = [
  "automation",
  "coverLetters",
  "resumes",
  "studios",
  "jobs",
  "apiDocs",
] as const;

const REQUEST_API_EDEN_PATTERN = new RegExp(
  `requestApi\\s*(?:<[^>]*>)?\\s*\\([^)]*API_ENDPOINTS\\.(?:${EDEN_OWNED_ENDPOINT_PREFIXES.join("|")})`,
  "gu",
);
const BUILD_AUTOMATION_RUN_PATTERN = /buildAutomationRunEndpoint\s*\(/gu;
const BUILD_COVER_LETTER_DETAIL_PATTERN = /buildCoverLetterDetailEndpoint\s*\(/gu;
const BUILD_JOB_DETAIL_PATTERN = /buildJobDetailEndpoint\s*\(/gu;
const BUILD_RESUME_DETAIL_PATTERN = /buildResumeDetailEndpoint\s*\(/gu;
const BUILD_STUDIO_DETAIL_PATTERN = /buildStudioDetailEndpoint\s*\(/gu;
const REQUEST_API_CALL_PATTERN = /requestApi\s*(?:<[^>]*>)?\s*\(/u;
/** Eden maps `coverLetters` → camel path (404); route segment is `cover-letters`. */
const CAMEL_COVER_LETTERS_API_PATTERN = /\bapi\.coverLetters\b/gu;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.includes("/locales/") ||
  // Binary export download still uses downloadApiFile + build*ExportEndpoint.
  filePath === "packages/client/composables/useCoverLetter.ts" ||
  filePath === "packages/client/composables/useResume.ts";

const collectMatchViolations = (
  filePath: string,
  content: string,
  pattern: RegExp,
  message: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(pattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message,
    });
  }
  return violations;
};

const collectCoverResumeEdenViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  if (REQUEST_API_CALL_PATTERN.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `${filePath.split("/").pop()} must use Eden api.*.* for JSON CRUD — requestApi dual path banned.`,
    });
  }
  if (filePath.endsWith("useCoverLetter.ts")) {
    violations.push(
      ...collectMatchViolations(
        filePath,
        content,
        BUILD_COVER_LETTER_DETAIL_PATTERN,
        'useCoverLetter must resolve detail via Eden api["cover-letters"]({ id }) — buildCoverLetterDetailEndpoint dual path banned.',
      ),
      ...collectMatchViolations(
        filePath,
        content,
        CAMEL_COVER_LETTERS_API_PATTERN,
        'Eden cover-letters path is kebab-case — use api["cover-letters"], not api.coverLetters (404).',
      ),
    );
  }
  if (filePath.endsWith("useResume.ts")) {
    violations.push(
      ...collectMatchViolations(
        filePath,
        content,
        BUILD_RESUME_DETAIL_PATTERN,
        "useResume must resolve detail via Eden api.resumes({ id }) — buildResumeDetailEndpoint dual path banned.",
      ),
    );
  }
  return violations;
};

const collectJobsStudioEdenViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  if (filePath.endsWith("useJobs.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message: "useJobs must use Eden api.jobs.* — requestApi dual path banned.",
      });
    }
    violations.push(
      ...collectMatchViolations(
        filePath,
        content,
        BUILD_JOB_DETAIL_PATTERN,
        "useJobs must resolve detail via Eden api.jobs({ id }) — buildJobDetailEndpoint dual path banned.",
      ),
    );
  }
  if (filePath.endsWith("useStudio.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message: "useStudio must use Eden api.studios.* — requestApi dual path banned.",
      });
    }
    violations.push(
      ...collectMatchViolations(
        filePath,
        content,
        BUILD_STUDIO_DETAIL_PATTERN,
        "useStudio must resolve detail via Eden api.studios({ id }) — buildStudioDetailEndpoint dual path banned.",
      ),
    );
  }
  return violations;
};

const collectGenericEdenViolations = (filePath: string, content: string): ValidationViolation[] => {
  const violations = [
    ...collectMatchViolations(
      filePath,
      content,
      REQUEST_API_EDEN_PATTERN,
      "Eden-owned HTTP must use useApi() branch — requestApi(API_ENDPOINTS.<owned>*) dual path banned.",
    ),
    ...collectMatchViolations(
      filePath,
      content,
      CAMEL_COVER_LETTERS_API_PATTERN,
      'Eden cover-letters path is kebab-case — use api["cover-letters"], not api.coverLetters (404).',
    ),
  ];
  if (filePath.includes("/composables/useAutomation.ts")) {
    violations.push(
      ...collectMatchViolations(
        filePath,
        content,
        BUILD_AUTOMATION_RUN_PATTERN,
        "useAutomation must resolve runs via Eden api.automation.runs({ id }) — buildAutomationRunEndpoint dual path banned.",
      ),
    );
  }
  return violations;
};

export const collectEdenDualPathViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (
    isAllowedFile(filePath) &&
    !filePath.endsWith("useCoverLetter.ts") &&
    !filePath.endsWith("useResume.ts")
  ) {
    return [];
  }
  if (filePath.endsWith("useCoverLetter.ts") || filePath.endsWith("useResume.ts")) {
    return collectCoverResumeEdenViolations(filePath, content);
  }
  return [
    ...collectJobsStudioEdenViolations(filePath, content),
    ...collectGenericEdenViolations(filePath, content),
  ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectEdenDualPathViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Eden dual-path validation failed:",
    await collectViolations(),
    "Eden dual-path validation passed.",
  );
}
