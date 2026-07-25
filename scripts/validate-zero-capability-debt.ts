/**
 * Fail-closed zero-debt gate: ledger must not list Remaining items, and
 * product SSOT wiring (IDE/Kokoro/OpenAPI/Whisper scripts) must exist.
 * Stops LDL "deferred / pre-existing / not mine" theater.
 */
import { readFile } from "node:fs/promises";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const LEDGER = "docs/ssot-ledger/top10-live-capabilities-2026-07-24.md";

const REQUIRED_WIRED = [
  {
    path: "packages/client/components/ui/AppCodeEditor.vue",
    needles: ["vim(", "showMinimap", "rectangularSelection", "createEditorCollabExtension"],
  },
  {
    path: "packages/client/components/ui/AppBlockEditor.vue",
    needles: ["@tiptap/vue-3", "StarterKit"],
  },
  {
    path: "packages/client/composables/useKeyboardShortcuts.ts",
    needles: ['key === "p"', 'key === "k"'],
  },
  {
    path: "packages/server/src/services/speech/speech-synthesize-service.ts",
    needles: ["/audio/speech", "RIFF"],
  },
  {
    path: "scripts/kokoro-openai-server.py",
    needles: ["kokoro_onnx", "/v1/audio/speech"],
  },
  {
    path: "scripts/whisper-openai-server.py",
    needles: ["faster_whisper", "/v1/audio/transcriptions"],
  },
  {
    path: "packages/server/src/utils/openapi-detail.ts",
    needles: ["openapiDetail"],
  },
  {
    path: "scripts/validate-no-soft-test-skips.ts",
    needles: ["collectSoftTestSkipViolations", "HONEST_STT_HARDCODED_BLOCKED"],
  },
  {
    path: "scripts/browser-proof-kokoro-tts.ts",
    needles: ["RIFF", "synthesizeCalls"],
  },
  {
    path: "scripts/browser-proof-whisper-stt.ts",
    needles: ["speech/transcribe", "whisper"],
  },
] as const;

export const collectZeroCapabilityDebtViolations = async (): Promise<ValidationViolation[]> => {
  const violations: ValidationViolation[] = [];
  const ledger = await readFile(LEDGER, "utf8");
  const remainingIdx = ledger.indexOf("## Remaining");
  if (remainingIdx !== -1) {
    const after = ledger.slice(remainingIdx);
    const nextHeading = after.search(/\n## /u);
    const section = nextHeading === -1 ? after : after.slice(0, nextHeading);
    const items = section
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\.\s+\*\*/u.test(line));
    if (items.length > 0) {
      violations.push({
        filePath: LEDGER,
        line: ledger.slice(0, remainingIdx).split("\n").length,
        message: `Ledger still lists ${String(items.length)} Remaining debt item(s). Close or delete Remaining — zero-debt grind forbids deferred theater.`,
      });
    }
  }

  if (/deferred|BLOCKED|manifest stub|not e2e-proven|unproven/iu.test(ledger.split("## Remaining")[1] ?? "")) {
    violations.push({
      filePath: LEDGER,
      line: 1,
      message: "Remaining section still contains BLOCKED/deferred/stub language.",
    });
  }

  for (const req of REQUIRED_WIRED) {
    const content = await readFile(req.path, "utf8");
    for (const needle of req.needles) {
      if (!content.includes(needle)) {
        violations.push({
          filePath: req.path,
          line: 1,
          message: `Missing required wiring marker "${needle}".`,
        });
      }
    }
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Zero capability debt validation failed:",
    await collectZeroCapabilityDebtViolations(),
    "Zero capability debt validation passed.",
  );
}
