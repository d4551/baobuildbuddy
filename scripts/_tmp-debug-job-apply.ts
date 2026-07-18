process.env.PLAYWRIGHT_BROWSERS_PATH = `${process.env.HOME}/Library/Caches/ms-playwright`;

import { createJobApplyFixtureServer } from "../packages/server/src/test-support/automation/job-apply-fixture";
import { runJobApplyScriptFixture } from "../packages/server/src/test-support/automation/job-apply-fixture";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDirectory = mkdtempSync(join(tmpdir(), "bao-job-apply-debug-"));
const result = await runJobApplyScriptFixture(tempDirectory);
console.log(
  JSON.stringify(
    {
      error: result.execution.error,
      statusHint: result.execution,
      submitted: result.submittedPayload,
    },
    null,
    2,
  ),
);
