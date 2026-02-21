import enUS, { type AppTranslationOverrides } from "../packages/client/locales/en-US";
import esES from "../packages/client/locales/es-ES";
import frFR from "../packages/client/locales/fr-FR";
import jaJP from "../packages/client/locales/ja-JP";
import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  locale: string;
  key: string;
  message: string;
};

type LocaleDefinition = {
  locale: string;
  messages: AppTranslationOverrides;
};

const localeDefinitions: readonly LocaleDefinition[] = [
  { locale: "fr-FR", messages: frFR },
  { locale: "ja-JP", messages: jaJP },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const serializeLeafValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

const flattenLocaleNode = (path: string, value: unknown, output: Map<string, string>): void => {
  if (isRecord(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      const childPath = path.length > 0 ? `${path}.${key}` : key;
      flattenLocaleNode(childPath, childValue, output);
    }
    return;
  }

  output.set(path, serializeLeafValue(value));
};

const toFlatMap = (value: unknown): Map<string, string> => {
  const flattened = new Map<string, string>();

  if (!isRecord(value)) {
    return flattened;
  }

  for (const [key, childValue] of Object.entries(value)) {
    flattenLocaleNode(key, childValue, flattened);
  }

  return flattened;
};

const collectViolations = (): Violation[] => {
  const baseMessages = toFlatMap(enUS);
  const spanishMessages = toFlatMap(esES);
  const violations: Violation[] = [];

  for (const localeDefinition of localeDefinitions) {
    const overrideMessages = toFlatMap(localeDefinition.messages);

    for (const [key, overrideValue] of overrideMessages) {
      const baseValue = baseMessages.get(key);
      if (baseValue === undefined) {
        violations.push({
          locale: localeDefinition.locale,
          key,
          message: "Override key does not exist in source locale schema.",
        });
        continue;
      }

      if (overrideValue === baseValue) {
        violations.push({
          locale: localeDefinition.locale,
          key,
          message: "Override value matches source locale value and should be removed.",
        });
      }

      const spanishValue = spanishMessages.get(key);
      if (
        spanishValue !== undefined &&
        spanishValue !== baseValue &&
        overrideValue === spanishValue
      ) {
        violations.push({
          locale: localeDefinition.locale,
          key,
          message:
            "Override value matches Spanish translation while differing from source locale value.",
        });
      }
    }
  }

  return violations;
};

const main = (): void => {
  const violations = collectViolations();

  if (violations.length === 0) {
    void writeOutput(
      "Locale override validation passed: no schema drift or cross-locale copy detected.",
    );
    return;
  }

  void writeError("Locale override validation failed:");
  for (const violation of violations) {
    void writeError(`- [${violation.locale}] ${violation.key}: ${violation.message}`);
  }
  process.exit(1);
};

main();
