import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

export const collectSeoContractViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (content.includes("useServerSeoMeta")) {
    return [
      {
        filePath,
        line: 1,
        message:
          "Page uses useServerSeoMeta(). Use useSeoMeta() so browser hydration keeps titles and descriptions in sync.",
      },
    ] satisfies ValidationViolation[];
  }

  if (!content.includes("useSeoMeta")) {
    return [
      {
        filePath,
        line: 1,
        message: "Page is missing useSeoMeta().",
      },
    ] satisfies ValidationViolation[];
  }

  const missingFields = ["title", "description"].filter(
    (fieldName) => !new RegExp(`\\b${fieldName}\\s*:`, "u").test(content),
  );
  if (missingFields.length === 0) {
    return [];
  }

  return [
    {
      filePath,
      line: 1,
      message: `SEO metadata is incomplete. Missing fields: ${missingFields.join(", ")}.`,
    },
  ] satisfies ValidationViolation[];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client/pages"],
    allowedExtensions: new Set([".vue"]),
  });

  return files.flatMap(({ filePath, content }) =>
    collectSeoContractViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "SEO contract validation failed:",
    await collectViolations(),
    "SEO contract validation passed.",
  );
}
