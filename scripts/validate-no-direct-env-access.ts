import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const allowedExtensions = new Set([".ts"]);
const scanRoots = ["packages/client", "packages/server/src", "packages/scraper/src"] as const;
const envPattern = /\b(?:process\.env|Bun\.env|import\.meta\.env)\b/gu;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.includes("/config/") ||
  filePath.endsWith("nuxt.config.ts") ||
  filePath.includes("/runtime/config.ts") ||
  filePath.endsWith("/job-apply.ts") ||
  filePath.endsWith("/middleware/logger.ts") ||
  filePath.endsWith("/db/client.ts") ||
  filePath.endsWith("/services/ai/ai-service.ts") ||
  filePath.endsWith("/services/automation/rpa-runner-process.ts") ||
  filePath.endsWith("/test-utils.ts") ||
  filePath.endsWith("/test-setup.ts");

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });

  return files.flatMap(({ filePath, content }) => {
    if (isAllowedFile(filePath)) {
      return [];
    }

    const violations: ValidationViolation[] = [];
    envPattern.lastIndex = 0;
    for (const match of content.matchAll(envPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "Direct environment access is forbidden here. Read from the package config module instead.",
      });
    }
    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Direct environment access validation failed:",
    await collectViolations(),
    "Direct environment access validation passed.",
  );
}
