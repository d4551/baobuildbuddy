/**
 * Shared helpers for headed proof / record scripts.
 */
import { writeError } from "./cli-output";

export const reportFindingsAndExit = async (findings: readonly string[]): Promise<void> => {
  if (findings.length === 0) {
    return;
  }
  await Promise.all(findings.map((finding) => writeError(finding)));
  process.exit(1);
};
