/**
 * @deprecated Use proof:whisper-stt — local Whisper is product STT SSOT.
 * This entrypoint redirects so CI cannot green on mic-BLOCKED theater.
 */
import { writeError, writeOutput } from "./utils/cli-output";

await writeOutput(
  "proof:stt-live redirects to proof:whisper-stt (local Whisper SSOT; mic-BLOCKED theater banned).",
);
const proc = Bun.spawn(["bun", "run", "scripts/browser-proof-whisper-stt.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: process.env,
});
const code = await proc.exited;
if (code !== 0) {
  await writeError("proof:stt-live failed via whisper-stt redirect");
  process.exit(code);
}
