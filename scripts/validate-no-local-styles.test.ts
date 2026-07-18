import { describe, expect, test } from "bun:test";
import { collectLocalStyleViolationsForContent } from "./validate-no-local-styles";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectLocalStyleViolationsForContent", () => {
  test("flags local <style> blocks in vue files", () => {
    const violations = collectLocalStyleViolationsForContent(
      CONSUMER_PATH,
      "<template><div /></template>\n<style scoped>\n.box { color: red; }\n</style>",
    );
    expect(violations.some((v) => v.message.includes("<style>"))).toBe(true);
  });

  test("passes vue files with only templates", () => {
    const violations = collectLocalStyleViolationsForContent(
      CONSUMER_PATH,
      "<template><div /></template>",
    );
    expect(violations).toHaveLength(0);
  });

  test("softening regression: flags <style> even without scoped attribute", () => {
    const violations = collectLocalStyleViolationsForContent(
      CONSUMER_PATH,
      "<template><div /></template>\n<style>\n.box { color: red; }\n</style>",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
