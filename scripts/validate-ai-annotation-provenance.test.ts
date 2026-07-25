import { describe, expect, test } from "bun:test";
import { collectAiProvenanceViolationsForContent } from "./validate-ai-annotation-provenance";

const AI_CHAT_PAGE = "packages/client/pages/ai/chat/index.vue";
const INTERVIEW_PAGE = "packages/client/pages/interview/session/index.vue";
const NON_AI_PAGE = "packages/client/pages/settings/index.vue";

describe("collectAiProvenanceViolationsForContent", () => {
  test("flags AI surface rendering aiMessage without provider", () => {
    const violations = collectAiProvenanceViolationsForContent(
      AI_CHAT_PAGE,
      [
        '<script setup lang="ts">',
        "const aiMessage = ref('hello');",
        "</script>",
        "<template><div>{{ aiMessage }}</div></template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("provider"))).toBe(true);
  });

  test("flags AI surface rendering aiMessage without model", () => {
    const violations = collectAiProvenanceViolationsForContent(
      AI_CHAT_PAGE,
      [
        '<script setup lang="ts">',
        "const aiMessage = ref('hello');",
        'const provider = ref("openai");',
        "</script>",
        "<template><div>{{ aiMessage }} {{ provider }}</div></template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("model"))).toBe(true);
  });

  test("allows AI surface that surfaces provider + model", () => {
    const violations = collectAiProvenanceViolationsForContent(
      AI_CHAT_PAGE,
      [
        '<script setup lang="ts">',
        "const aiMessage = ref('hello');",
        'const provider = ref("openai");',
        'const model = ref("gpt-4");',
        "</script>",
        "<template><div>{{ aiMessage }} <span>{{ provider }} / {{ model }}</span></div></template>",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });

  test("requires confidence on interview score surface", () => {
    const violations = collectAiProvenanceViolationsForContent(
      INTERVIEW_PAGE,
      [
        '<script setup lang="ts">',
        "const aiMessage = ref('feedback');",
        'const provider = ref("openai");',
        'const model = ref("gpt-4");',
        "const interviewScore = ref(85);",
        "</script>",
        "<template><div>{{ aiMessage }} {{ provider }} {{ model }} {{ interviewScore }}</div></template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("confidence"))).toBe(true);
  });

  test("allows interview surface with provider + model + confidence", () => {
    const violations = collectAiProvenanceViolationsForContent(
      INTERVIEW_PAGE,
      [
        '<script setup lang="ts">',
        "const aiMessage = ref('feedback');",
        'const provider = ref("openai");',
        'const model = ref("gpt-4");',
        "const confidence = ref(0.9);",
        "</script>",
        "<template><div>{{ aiMessage }} {{ provider }} {{ model }} {{ confidence }}</div></template>",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag non-AI pages", () => {
    const violations = collectAiProvenanceViolationsForContent(
      NON_AI_PAGE,
      "<template><div>settings</div></template>",
    );
    expect(violations).toHaveLength(0);
  });
});
