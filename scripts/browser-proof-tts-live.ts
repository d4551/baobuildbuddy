/**
 * @deprecated Use proof:kokoro-tts — local Kokoro is product TTS SSOT.
 * This entrypoint redirects so CI cannot green on speechSynthesis-only.
 */
import { writeError, writeOutput } from "./utils/cli-output";

await writeOutput(
  "proof:tts-live redirects to proof:kokoro-tts (local Kokoro SSOT; speechSynthesis-only banned).",
);
const proc = Bun.spawn(["bun", "run", "scripts/browser-proof-kokoro-tts.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});
const code = await proc.exited;
if (code !== 0) {
  await writeError("proof:tts-live failed via kokoro-tts redirect");
  process.exit(code);
}
