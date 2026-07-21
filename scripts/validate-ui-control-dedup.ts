import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Duplicate actionable-control fingerprint gate.
 *
 * When the same control fingerprint (i18n aria/label key + btn size classes)
 * appears in ≥2 components co-mounted on one page (or in a registered
 * composition group), that is a DRY / session-rail duplication defect.
 */

export type ControlFingerprint = {
  readonly i18nKey: string;
  readonly btnClasses: string;
  readonly filePath: string;
  readonly line: number;
};

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const TEMPLATE_I18N_KEY_PATTERN = /\bt\s*\(\s*["']([a-zA-Z0-9_.]+)["']/gu;
const ARIA_LABEL_I18N_PATTERN = /:aria-label\s*=\s*["']t\(\s*["']([a-zA-Z0-9_.]+)["']/gu;
const BTN_CLASS_LIST_PATTERN = /\bclass\s*=\s*["']([^"']*\bbtn\b[^"']*)["']/gu;
const BTN_SIZE_TOKEN_PATTERN =
  /\bbtn(?:-(?:xs|sm|md|lg|soft|ghost|outline|primary|secondary|accent|neutral|link|circle|square))?\b/gu;
const PAGE_COMPONENT_TAG_PATTERN = /<([A-Z][A-Za-z0-9]+)\b/gu;
const SCRIPT_COMPONENT_IMPORT_PATTERN =
  /import\s+(\w+)\s+from\s+["'](~\/components\/[^"']+\.vue)["']/gu;
const NEIGHBORHOOD_BTN_PATTERN = /\bbtn\b/u;
const CONTROL_I18N_KEY_SHAPE_PATTERN =
  /(?:button|aria|suggestion|prompt|action|submit|clear|send|toggle)/iu;

/** Known co-mounted AI chat surfaces (widgets not always page-imported). */
export const AI_CHAT_CO_MOUNT_GROUP = [
  "packages/client/components/ai/AIChatSidebar.vue",
  "packages/client/components/ai/AIChatConversationPanel.vue",
  "packages/client/components/ai/FloatingChatPanel.vue",
] as const;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const normalizeBtnClasses = (classValue: string): string => {
  BTN_SIZE_TOKEN_PATTERN.lastIndex = 0;
  const tokens = classValue.match(BTN_SIZE_TOKEN_PATTERN) ?? [];
  return [...new Set(tokens)].sort().join(" ");
};

const pushAriaLabelFingerprints = (
  filePath: string,
  content: string,
  template: string,
  templateOffset: number,
  fingerprints: ControlFingerprint[],
): void => {
  ARIA_LABEL_I18N_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(ARIA_LABEL_I18N_PATTERN)) {
    const i18nKey = match[1] ?? "";
    if (i18nKey.length === 0) continue;
    const matchIndex = match.index ?? 0;
    const tagStart = template.lastIndexOf("<", matchIndex);
    const tagEnd = template.indexOf(">", matchIndex);
    if (tagStart < 0 || tagEnd < tagStart) continue;
    const openingTag = template.slice(tagStart, tagEnd + 1);
    if (!NEIGHBORHOOD_BTN_PATTERN.test(openingTag)) continue;
    BTN_CLASS_LIST_PATTERN.lastIndex = 0;
    const btnMatch = openingTag.matchAll(BTN_CLASS_LIST_PATTERN).next().value;
    fingerprints.push({
      i18nKey,
      btnClasses: normalizeBtnClasses(btnMatch?.[1] ?? "btn"),
      filePath,
      line: getLineFromOffset(content, matchIndex + Math.max(0, templateOffset)),
    });
  }
};

const pushBtnLabelFingerprints = (
  filePath: string,
  content: string,
  template: string,
  templateOffset: number,
  fingerprints: ControlFingerprint[],
): void => {
  BTN_CLASS_LIST_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(BTN_CLASS_LIST_PATTERN)) {
    const btnClasses = normalizeBtnClasses(match[1] ?? "btn");
    const matchIndex = match.index ?? 0;
    const after = template.slice(matchIndex, matchIndex + 400);
    TEMPLATE_I18N_KEY_PATTERN.lastIndex = 0;
    const labelMatch = TEMPLATE_I18N_KEY_PATTERN.exec(after);
    if (!labelMatch) continue;
    const i18nKey = labelMatch[1] ?? "";
    if (fingerprints.some((fp) => fp.filePath === filePath && fp.i18nKey === i18nKey)) continue;
    if (!CONTROL_I18N_KEY_SHAPE_PATTERN.test(i18nKey)) continue;
    fingerprints.push({
      i18nKey,
      btnClasses,
      filePath,
      line: getLineFromOffset(content, matchIndex + Math.max(0, templateOffset)),
    });
  }
};

/**
 * Extract control fingerprints from a Vue SFC template.
 * Prefer aria-label i18n keys on btn controls; fall back to nearby t('…') keys
 * inside the same btn opening-tag neighborhood.
 */
export const extractControlFingerprints = (
  filePath: string,
  content: string,
): ControlFingerprint[] => {
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const templateOffset = content.indexOf("<template>");
  const fingerprints: ControlFingerprint[] = [];
  pushAriaLabelFingerprints(filePath, content, template, templateOffset, fingerprints);
  pushBtnLabelFingerprints(filePath, content, template, templateOffset, fingerprints);
  return fingerprints;
};

const fingerprintKey = (fp: ControlFingerprint): string => `${fp.i18nKey}::${fp.btnClasses}`;

const resolveComponentPathFromTag = (
  tagName: string,
  scriptImports: Map<string, string>,
): string | null => {
  const imported = scriptImports.get(tagName);
  if (imported) {
    return imported.startsWith("~/") ? `packages/client/${imported.slice(2)}` : imported;
  }
  // Nuxt auto-import convention: AIChatSidebar → components/**/AIChatSidebar.vue
  return null;
};

const collectScriptImports = (content: string): Map<string, string> => {
  const map = new Map<string, string>();
  SCRIPT_COMPONENT_IMPORT_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(SCRIPT_COMPONENT_IMPORT_PATTERN)) {
    const name = match[1] ?? "";
    const path = match[2] ?? "";
    if (name.length > 0 && path.length > 0) map.set(name, path);
  }
  return map;
};

const collectAutoImportCandidates = (
  tagName: string,
  allComponentPaths: readonly string[],
): string[] => allComponentPaths.filter((path) => path.endsWith(`/${tagName}.vue`));

export const collectControlDedupViolationsForGroup = (
  groupPaths: readonly string[],
  fileContents: ReadonlyMap<string, string>,
): ValidationViolation[] => {
  const byKey = new Map<string, ControlFingerprint[]>();
  for (const filePath of groupPaths) {
    const content = fileContents.get(filePath);
    if (content === undefined) continue;
    for (const fp of extractControlFingerprints(filePath, content)) {
      const key = fingerprintKey(fp);
      const list = byKey.get(key) ?? [];
      list.push(fp);
      byKey.set(key, list);
    }
  }

  const violations: ValidationViolation[] = [];
  for (const [key, fps] of byKey) {
    const uniqueFiles = [...new Set(fps.map((fp) => fp.filePath))];
    if (uniqueFiles.length < 2) continue;
    const [i18nKey, btnClasses] = key.split("::");
    for (const fp of fps) {
      violations.push({
        filePath: fp.filePath,
        line: fp.line,
        message: `Duplicate control fingerprint i18nKey="${i18nKey}" btn="${btnClasses}" also appears in: ${uniqueFiles.filter((f) => f !== fp.filePath).join(", ")}. Extract a shared primitive or mount the control once.`,
      });
    }
  }
  return violations;
};

export const collectControlDedupViolationsForContentMap = (
  pagePath: string,
  pageContent: string,
  fileContents: ReadonlyMap<string, string>,
  allComponentPaths: readonly string[],
): ValidationViolation[] => {
  const scriptImports = collectScriptImports(pageContent);
  const template = extractTemplateBlocks(pageContent);
  const mountedPaths = new Set<string>();

  PAGE_COMPONENT_TAG_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(PAGE_COMPONENT_TAG_PATTERN)) {
    const tagName = match[1] ?? "";
    if (tagName.length === 0) continue;
    const fromImport = resolveComponentPathFromTag(tagName, scriptImports);
    if (fromImport) {
      mountedPaths.add(fromImport);
      continue;
    }
    for (const candidate of collectAutoImportCandidates(tagName, allComponentPaths)) {
      mountedPaths.add(candidate);
    }
  }

  if (mountedPaths.size < 2) return [];
  return collectControlDedupViolationsForGroup([...mountedPaths], fileContents).map(
    (violation) => ({
      ...violation,
      message: `${violation.message} (co-mounted via ${pagePath})`,
    }),
  );
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  const fileContents = new Map(files.map((entry) => [entry.filePath, entry.content]));
  const allComponentPaths = files
    .map((entry) => entry.filePath)
    .filter((path) => path.startsWith("packages/client/components/"));
  const pagePaths = files
    .map((entry) => entry.filePath)
    .filter((path) => path.startsWith("packages/client/pages/") && path.endsWith(".vue"));

  const violations: ValidationViolation[] = [];

  // Registered composition groups (AI chat session rail + floating widget).
  violations.push(...collectControlDedupViolationsForGroup(AI_CHAT_CO_MOUNT_GROUP, fileContents));

  for (const pagePath of pagePaths) {
    const pageContent = fileContents.get(pagePath);
    if (pageContent === undefined) continue;
    violations.push(
      ...collectControlDedupViolationsForContentMap(
        pagePath,
        pageContent,
        fileContents,
        allComponentPaths,
      ),
    );
  }

  // De-dupe identical file:line:message triples from group + page double-scan.
  const seen = new Set<string>();
  return violations.filter((violation) => {
    const key = `${violation.filePath}:${violation.line}:${violation.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

if (import.meta.main) {
  await reportViolations(
    "UI control dedup validation failed:",
    await collectViolations(),
    "UI control dedup validation passed.",
  );
}
