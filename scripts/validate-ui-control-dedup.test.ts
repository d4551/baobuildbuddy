import { describe, expect, test } from "bun:test";
import {
  AI_CHAT_CO_MOUNT_GROUP,
  collectControlDedupViolationsForGroup,
  extractControlFingerprints,
} from "./validate-ui-control-dedup";

const SIDEBAR = "packages/client/components/ai/AIChatSidebar.vue";
const CONVERSATION = "packages/client/components/ai/AIChatConversationPanel.vue";
const FLOATING = "packages/client/components/ai/FloatingChatPanel.vue";

const promptChipTemplate = (keyPrefix: string): string =>
  [
    "<template>",
    "<ul>",
    "  <li>",
    "    <button",
    '      type="button"',
    '      class="btn btn-sm btn-soft"',
    `      :aria-label="t('floatingChat.suggestionAria', { prompt })"`,
    "      @click=\"emit('prompt', prompt)\"",
    "    >",
    `      {{ ${keyPrefix} }}`,
    "    </button>",
    "  </li>",
    "</ul>",
    "</template>",
  ].join("\n");

describe("extractControlFingerprints", () => {
  test("extracts aria-label i18n key on btn controls", () => {
    const fps = extractControlFingerprints(SIDEBAR, promptChipTemplate("prompt"));
    expect(fps.some((fp) => fp.i18nKey === "floatingChat.suggestionAria")).toBe(true);
    expect(fps.some((fp) => fp.btnClasses.includes("btn-sm"))).toBe(true);
  });
});

describe("collectControlDedupViolationsForGroup", () => {
  test("flags identical prompt-chip fingerprints across AI chat surfaces", () => {
    const fileContents = new Map<string, string>([
      [SIDEBAR, promptChipTemplate("prompt")],
      [CONVERSATION, promptChipTemplate("prompt")],
      [FLOATING, promptChipTemplate("prompt")],
    ]);
    const violations = collectControlDedupViolationsForGroup(AI_CHAT_CO_MOUNT_GROUP, fileContents);
    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(violations.every((v) => v.message.includes("floatingChat.suggestionAria"))).toBe(true);
  });

  test("passes when fingerprints differ", () => {
    const fileContents = new Map<string, string>([
      [
        SIDEBAR,
        '<template><button class="btn btn-sm" :aria-label="t(\'aiChatPage.clearAria\')" @click="x">x</button></template>',
      ],
      [
        CONVERSATION,
        '<template><button class="btn btn-primary" :aria-label="t(\'aiChatPage.sendAria\')" @click="y">y</button></template>',
      ],
    ]);
    const violations = collectControlDedupViolationsForGroup([SIDEBAR, CONVERSATION], fileContents);
    expect(violations).toHaveLength(0);
  });

  test("passes when fingerprint appears in only one file", () => {
    const fileContents = new Map<string, string>([
      [SIDEBAR, promptChipTemplate("prompt")],
      [CONVERSATION, "<template><div /></template>"],
    ]);
    const violations = collectControlDedupViolationsForGroup([SIDEBAR, CONVERSATION], fileContents);
    expect(violations).toHaveLength(0);
  });
});
