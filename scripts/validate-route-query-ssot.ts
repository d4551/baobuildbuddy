/**
 * Fail when pages re-implement route section query decoding instead of
 * `~/utils/route-query` (SSOT). Catches duplicated section rails wiring.
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const SCAN_ROOTS = ["packages/client/pages"] as const;
const SOURCE_EXTENSIONS = [".vue"] as const;

const INLINE_SECTION_DECODE_PATTERN =
  /typeof\s+\w+\s*===\s*["']string["'][\s\S]{0,120}Array\.isArray\(\w+\)/u;
const ROUTE_QUERY_IMPORT_PATTERN = /from\s+["']~\/utils\/route-query["']/u;
const SECTION_QUERY_KEY_PATTERN = /APP_ROUTE_QUERY_KEYS\.section/u;

export const collectRouteQuerySsotViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!SECTION_QUERY_KEY_PATTERN.test(content)) {
    return [];
  }
  if (ROUTE_QUERY_IMPORT_PATTERN.test(content) && !INLINE_SECTION_DECODE_PATTERN.test(content)) {
    return [];
  }
  if (INLINE_SECTION_DECODE_PATTERN.test(content) || !ROUTE_QUERY_IMPORT_PATTERN.test(content)) {
    return [
      {
        filePath,
        line: 1,
        message:
          "Section query must use resolveRouteSectionId from ~/utils/route-query (no inline string|array decode).",
      },
    ];
  }
  return [];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...SCAN_ROOTS],
    allowedExtensions: new Set(SOURCE_EXTENSIONS),
  });
  return files.flatMap(({ filePath, content }) =>
    collectRouteQuerySsotViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Route query SSOT validation failed:",
    await collectViolations(),
    "Route query SSOT validation passed.",
  );
}
