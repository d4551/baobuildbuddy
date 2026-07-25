import { describe, expect, test } from "bun:test";
import {
  isDishonestJobApplySuccess,
  resolveHonestAutomationRunStatus,
} from "./automation-run-honesty";

describe("automation-run-honesty", () => {
  test("keeps honest fixture success", () => {
    expect(
      isDishonestJobApplySuccess({
        type: "job_apply",
        status: "success",
        output: {
          success: true,
          steps: [
            { action: "fill_name", status: "ok" },
            { action: "verify", status: "ok", message: "Submission confirmation detected" },
          ],
        },
      }),
    ).toBe(false);
  });

  test("repairs success with step errors", () => {
    expect(
      resolveHonestAutomationRunStatus({
        type: "job_apply",
        status: "success",
        output: {
          success: true,
          steps: [
            { action: "fill_email", status: "error", message: "Email field not found" },
            { action: "verify", status: "ok", message: "No confirmation text detected" },
          ],
        },
      }),
    ).toBe("error");
  });

  test("repairs verify no-confirmation marked success", () => {
    expect(
      isDishonestJobApplySuccess({
        type: "job_apply",
        status: "success",
        output: {
          success: true,
          steps: [{ action: "verify", status: "ok", message: "No confirmation text detected" }],
        },
      }),
    ).toBe(true);
  });

  test("ignores scrape rows", () => {
    expect(
      isDishonestJobApplySuccess({
        type: "scrape",
        status: "success",
        output: { success: true },
      }),
    ).toBe(false);
  });
});
