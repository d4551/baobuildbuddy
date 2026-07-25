import { describe, expect, it } from "bun:test";
import { collectJsonEditorSsotViolations } from "./validate-json-editor-ssot";

describe("validate-json-editor-ssot", () => {
  it("flags settings raw font-mono textarea with Json v-model", () => {
    const violations = collectJsonEditorSsotViolations([
      {
        filePath: "packages/client/components/settings/Foo.vue",
        content: `<textarea class="textarea font-mono" v-model="jobProviderForm.greenhouseBoardsJson" />`,
      },
    ]);
    expect(violations.length).toBeGreaterThan(0);
  });

  it("allows AppJsonField host", () => {
    expect(
      collectJsonEditorSsotViolations([
        {
          filePath: "packages/client/components/ui/AppJsonField.vue",
          content: `<textarea class="textarea font-mono" v-model="modelValue" />`,
        },
      ]),
    ).toEqual([]);
  });
});
