/**
 * Fail-closed: product TTS must be local Kokoro — not cloud, not speechSynthesis-only lies.
 */
import { readFile } from "node:fs/promises";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

export const collectLocalKokoroTtsViolations = async (): Promise<ValidationViolation[]> => {
  const violations: ValidationViolation[] = [];
  const settingsPath = "packages/shared/src/constants/settings.ts";
  const speakPath = "packages/client/composables/useSpeech.ts";
  const synthesizePath = "packages/server/src/services/speech/speech-synthesize-service.ts";
  const [settings, speak, synthesize] = await Promise.all([
    readFile(settingsPath, "utf8"),
    readFile(speakPath, "utf8"),
    readFile(synthesizePath, "utf8"),
  ]);

  if (!settings.includes('DEFAULT_TTS_PROVIDER: SpeechProviderOption = "local"')) {
    violations.push({
      filePath: settingsPath,
      line: 1,
      message: 'DEFAULT_TTS_PROVIDER must be "local" (Kokoro on-device).',
    });
  }
  if (!settings.includes("DEFAULT_LOCAL_TTS_ENDPOINT")) {
    violations.push({
      filePath: settingsPath,
      line: 1,
      message: "DEFAULT_LOCAL_TTS_ENDPOINT missing for Kokoro OpenAI-compatible base.",
    });
  }
  if (!speak.includes("synthesizeSpeechViaServer") || !speak.includes("shouldUseLocalKokoroTts")) {
    violations.push({
      filePath: speakPath,
      line: 1,
      message: "useSpeech must route local TTS through synthesizeSpeechViaServer (Kokoro).",
    });
  }
  if (!synthesize.includes("/audio/speech") || !synthesize.includes("RIFF")) {
    violations.push({
      filePath: synthesizePath,
      line: 1,
      message: "speech-synthesize-service must call /audio/speech and verify RIFF WAV bytes.",
    });
  }
  // Soft-ban: browser-only on-device proof must not be the sole TTS gate claim in ledger without Kokoro.
  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Local Kokoro TTS validation failed:",
    await collectLocalKokoroTtsViolations(),
    "Local Kokoro TTS validation passed.",
  );
}
