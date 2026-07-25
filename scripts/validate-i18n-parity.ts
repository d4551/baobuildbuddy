import enUS from "../packages/client/locales/en-US";
import esES from "../packages/client/locales/es-ES";
import frFR from "../packages/client/locales/fr-FR";
import jaJP from "../packages/client/locales/ja-JP";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

type LocaleModule = Record<string, unknown>;

const locales: Array<{ filePath: string; value: LocaleModule }> = [
  { filePath: "packages/client/locales/es-ES.ts", value: esES },
  { filePath: "packages/client/locales/fr-FR.ts", value: frFR },
  { filePath: "packages/client/locales/ja-JP.ts", value: jaJP },
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

const referenceKeys = new Set(collectPaths(enUS));

export const collectViolations = (): ValidationViolation[] =>
  locales.flatMap(({ filePath, value }) => {
    const localeKeys = new Set(collectPaths(value));
    const missingKeys = [...referenceKeys].filter((key) => !localeKeys.has(key));
    const extraKeys = [...localeKeys].filter((key) => !referenceKeys.has(key));

    return [
      ...missingKeys.map(
        (key): ValidationViolation => ({
          filePath,
          line: 1,
          message: `Missing locale key "${key}" required by en-US.`,
        }),
      ),
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
