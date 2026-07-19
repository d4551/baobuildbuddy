const template = [
  "<template>",
  "<ul>",
  "  <li>",
  "    <button",
  '      type="button"',
  '      class="btn btn-sm btn-soft"',
  `      :aria-label="t('floatingChat.suggestionAria', { prompt })"`,
  "      @click=\"emit('prompt', prompt)\"",
  "    >",
  "      {{ prompt }}",
  "    </button>",
  "  </li>",
  "</ul>",
  "</template>",
].join("\n");

const ARIA_LABEL_I18N_PATTERN = /:aria-label\s*=\s*["']t\(\s*["']([a-zA-Z0-9_.]+)["']/gu;
const BTN_CLASS_LIST_PATTERN = /\bclass\s*=\s*["']([^"']*\bbtn\b[^"']*)["']/gu;
const BTN_SIZE_TOKEN_PATTERN =
  /\bbtn(?:-(?:xs|sm|md|lg|soft|ghost|outline|primary|secondary|accent|neutral|link|circle|square))?\b/gu;

const matches = [...template.matchAll(ARIA_LABEL_I18N_PATTERN)];
const match = matches[0];
const matchIndex = match?.index ?? -1;
const tagStart = template.lastIndexOf("<", matchIndex);
const tagEnd = template.indexOf(">", matchIndex);
const openingTag = template.slice(tagStart, tagEnd + 1);
BTN_CLASS_LIST_PATTERN.lastIndex = 0;
const btnMatch = openingTag.match(BTN_CLASS_LIST_PATTERN);
BTN_SIZE_TOKEN_PATTERN.lastIndex = 0;
const tokens = (btnMatch?.[1] ?? "btn").match(BTN_SIZE_TOKEN_PATTERN) ?? [];

await Bun.write(
  "docs/ssot-ledger/debug-control-dedup.json",
  JSON.stringify(
    {
      matchIndex,
      tagStart,
      tagEnd,
      openingTag,
      btnMatch,
      tokens,
      ariaMatch: match?.[0],
    },
    null,
    2,
  ),
);
