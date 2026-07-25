import { describe, expect, test } from "bun:test";
import { collectProseEditorSsotViolations } from "./validate-prose-editor-ssot";

describe("validate-prose-editor-ssot", () => {
  test("flags editable textarea on portfolio surface", () => {
    const violations = collectProseEditorSsotViolations([
      {
        filePath: "packages/client/components/portfolio/PortfolioProfileCard.vue",
        content: `<textarea class="textarea" v-model="bio"></textarea>`,
      },
    ]);
    expect(violations.length).toBe(1);
  });

  test("allows readonly reply textarea on email page", () => {
    const violations = collectProseEditorSsotViolations([
      {
        filePath: "packages/client/pages/automation/email.vue",
        content: `<textarea class="textarea" readonly :value="reply"></textarea>`,
      },
    ]);
    expect(violations.length).toBe(0);
  });

  test("skips interview chat composer", () => {
    const violations = collectProseEditorSsotViolations([
      {
        filePath: "packages/client/components/interview/InterviewChat.vue",
        content: `<textarea class="textarea" v-model="currentResponse"></textarea>`,
      },
    ]);
    expect(violations.length).toBe(0);
  });
});
