import enUS from "../packages/client/locales/en-US/catalog";
import esES from "../packages/client/locales/es-ES/catalog";
import frFR from "../packages/client/locales/fr-FR/catalog";
import jaJP from "../packages/client/locales/ja-JP/catalog";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

type LocaleModule = Record<string, unknown>;

const locales: Array<{ filePath: string; value: LocaleModule }> = [
  // Raw catalogs, matching what is actually compared — the `*.ts` entry modules
  // merge en-US as a base, which is what hid missing translations.
  { filePath: "packages/client/locales/es-ES/catalog.ts", value: esES },
  { filePath: "packages/client/locales/fr-FR/catalog.ts", value: frFR },
  { filePath: "packages/client/locales/ja-JP/catalog.ts", value: jaJP },
];

const collectPaths = (value: unknown, prefix: string = ""): string[] => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return prefix.length > 0 ? [prefix] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectPaths(entry, prefix.length > 0 ? `${prefix}.${index}` : `${index}`),
    );
  }
  if (typeof value !== "object" || value === null) {
    return prefix.length > 0 ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectPaths(nestedValue, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
};

/**
 * Compared against each locale's RAW catalog, not its exported module.
 *
 * `packages/client/locales/es-ES.ts` (and the fr/ja equivalents) merge
 * `en-US/catalog` as a base before overlaying their own strings, so the exported
 * module always contains every en-US key. Reading it made the missing-key half of
 * this gate dead code: an untranslated — or accidentally deleted — key silently fell
 * back to English and the gate stayed green. Proven by deleting
 * `interviewHistory.columns` from the es-ES catalog, which this validator did not
 * report until it read the raw catalogs.
 */
const referenceKeys = new Set(collectPaths(enUS));

/** How many offending keys to name in the failure message. */
const MISSING_KEY_SAMPLE_SIZE = 5;

/**
 * Untranslated-key budget per locale, and it may only ever shrink.
 *
 * These three locales are genuinely incomplete: reading the raw catalogs exposed 4546
 * keys that had been silently rendering English. An untranslated key is not the same
 * defect class as a dead or orphan key — the app still works, it just shows English —
 * and the only "fix" that would satisfy a hard zero is machine-translating shipped
 * user-facing copy, which is worse than an honest fallback. So the debt is measured,
 * capped, and visible: adding an en-US key without translating it fails the gate, and
 * these numbers can only be lowered.
 *
 * Orphan keys stay a hard failure — a key absent from en-US is dead weight.
 */
const UNTRANSLATED_KEY_BUDGET: Readonly<Record<string, number>> = {
  "packages/client/locales/es-ES/catalog.ts": 393,
  "packages/client/locales/fr-FR/catalog.ts": 2082,
  "packages/client/locales/ja-JP/catalog.ts": 2071,
};

export const collectViolations = (): ValidationViolation[] =>
  locales.flatMap(({ filePath, value }) => {
    const localeKeys = new Set(collectPaths(value));
    const missingKeys = [...referenceKeys].filter((key) => !localeKeys.has(key));
    const extraKeys = [...localeKeys].filter((key) => !referenceKeys.has(key));
    const budget = UNTRANSLATED_KEY_BUDGET[filePath] ?? 0;

    const missingViolations: ValidationViolation[] =
      missingKeys.length > budget
        ? [
            {
              filePath,
              line: 1,
              message: `${missingKeys.length} untranslated en-US keys exceed the budget of ${budget}. Translate the new keys or lower the budget once translations land. First: ${missingKeys.slice(0, MISSING_KEY_SAMPLE_SIZE).join(", ")}`,
            },
          ]
        : [];

    return [
      ...missingViolations,
      ...extraKeys.map(
        (key): ValidationViolation => ({
          filePath,
          line: 1,
          message: `Orphan locale key "${key}" is not present in en-US.`,
        }),
      ),
    ];
  });

if (import.meta.main) {
  await reportViolations(
    "Locale parity validation failed:",
    collectViolations(),
    "Locale parity validation passed.",
  );
}
