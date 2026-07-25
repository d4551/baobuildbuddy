/**
 * Fail-closed zero-debt gate: ledger must not list Remaining items, and
 * product SSOT wiring (IDE/Kokoro/OpenAPI/Whisper scripts) must exist.
 * Stops LDL "deferred / pre-existing / not mine" theater.
 */
import { readFile } from "node:fs/promises";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const LEDGER = "docs/ssot-ledger/top10-live-capabilities-2026-07-24.md";

const NEXT_HEADING_PATTERN = /\n## /u;
const REMAINING_ITEM_PATTERN = /^\d+\.\s+\*\*/u;
const REMAINING_SOFT_LANGUAGE_PATTERN = /deferred|BLOCKED|manifest stub|not e2e-proven|unproven/iu;

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

const collectRemainingLedgerViolations = (ledger: string): ValidationViolation[] => {
  const remainingIdx = ledger.indexOf("## Remaining");
  if (remainingIdx === -1) {
    return [];
  }
  const after = ledger.slice(remainingIdx);
  const nextHeading = after.search(NEXT_HEADING_PATTERN);
  const section = nextHeading === -1 ? after : after.slice(0, nextHeading);
  const items = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => REMAINING_ITEM_PATTERN.test(line));
  const violations: ValidationViolation[] = [];
  if (items.length > 0) {
    violations.push({
      filePath: LEDGER,
      line: ledger.slice(0, remainingIdx).split("\n").length,
      message: `Ledger still lists ${String(items.length)} Remaining debt item(s). Close or delete Remaining — zero-debt grind forbids deferred theater.`,
    });
  }
  if (REMAINING_SOFT_LANGUAGE_PATTERN.test(ledger.split("## Remaining")[1] ?? "")) {
    violations.push({
      filePath: LEDGER,
      line: 1,
      message: "Remaining section still contains BLOCKED/deferred/stub language.",
    });
  }
  return violations;
};

const collectWiringViolations = async (): Promise<ValidationViolation[]> => {
  const contents = await Promise.all(
    REQUIRED_WIRED.map(async (req) => ({
      req,
      content: await readFile(req.path, "utf8"),
    })),
  );
  const violations: ValidationViolation[] = [];
  for (const { req, content } of contents) {
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

const collectZeroCapabilityDebtViolations = async (): Promise<ValidationViolation[]> => {
  const ledger = await readFile(LEDGER, "utf8");
  return [...collectRemainingLedgerViolations(ledger), ...(await collectWiringViolations())];
};

if (import.meta.main) {
  await reportViolations(
    "Zero capability debt validation failed:",
    await collectZeroCapabilityDebtViolations(),
    "Zero capability debt validation passed.",
  );
}
