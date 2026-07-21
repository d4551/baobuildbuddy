import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const files = [
  "packages/client/components/ui/WorkspaceSectionNavigator.vue",
  "packages/client/components/ui/WorkPipeline.vue",
  "packages/client/components/layout/WorkspaceOmniSearch.vue",
  "packages/client/components/ai/AIChatBubble.vue",
  "packages/client/components/settings/SettingsAiProviderAccordionList.vue",
  "packages/client/components/settings/SettingsAIProvidersPanel.vue",
  "packages/client/components/settings/brand/BrandPreviewCard.vue",
  "packages/client/components/skills/SkillsPathwaysGrid.vue",
  "packages/client/pages/interview/index.vue",
  "packages/client/components/interview/StudioSelector.vue",
  "packages/client/components/automation/AutomationScraperCapabilityCard.vue",
  "packages/client/components/jobs/JobMatchScore.vue",
  "packages/client/components/interview/InterviewRecentSessionsCard.vue",
] as const;

const ensureImport = (content: string, symbols: string[]): string => {
  const needed = symbols.filter((s) => content.includes(s));
  if (needed.length === 0) return content;
  const importMatch = content.match(
    /import\s*\{([^}]+)\}\s*from\s*["']~\/constants\/layout["']\s*;?/u,
  );
  if (!importMatch) return content;
  const existing = importMatch[1]
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const merged = [...new Set([...existing, ...needed])].sort();
  return content.replace(
    importMatch[0],
    `import {\n  ${merged.join(",\n  ")},\n} from "~/constants/layout";`,
  );
};

let changed = 0;
for (const rel of files) {
  const path = join(process.cwd(), rel);
  let content = readFileSync(path, "utf8");
  const original = content;
  const used: string[] = [];

  const pairs: Array<[string, string]> = [
    ['class="badge badge-ghost badge-xs shrink-0"', ':class="[BADGE_GHOST_XS_CLASS, \'shrink-0\']"'],
    ['class="badge badge-soft badge-sm shrink-0"', ':class="[BADGE_SOFT_SM_CLASS, \'shrink-0\']"'],
    ['class="badge badge-ghost badge-xs text-muted"', ':class="[BADGE_GHOST_XS_CLASS, \'text-muted\']"'],
    ['class="badge badge-success badge-xs"', ':class="[BADGE_SUCCESS_SM_CLASS]"'],
    ['"badge badge-outline border-current/20 text-current/80"', "BADGE_OUTLINE_CLASS + ' border-current/20 text-current/80'"],
    ['"badge badge-accent badge-lg border-0"', "'badge badge-accent badge-lg border-0'"],
    ['"badge badge-secondary badge-outline"', "'badge badge-secondary badge-outline'"],
    ['"badge-ghost"', "BADGE_GHOST_CLASS"],
    ["'badge-ghost'", "BADGE_GHOST_CLASS"],
    ['"badge badge-xs whitespace-nowrap"', "BADGE_GHOST_XS_CLASS + ' whitespace-nowrap'"],
  ];

  for (const [from, to] of pairs) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      if (to.includes("BADGE_GHOST_XS")) used.push("BADGE_GHOST_XS_CLASS");
      if (to.includes("BADGE_SOFT_SM")) used.push("BADGE_SOFT_SM_CLASS");
      if (to.includes("BADGE_SUCCESS_SM")) used.push("BADGE_SUCCESS_SM_CLASS");
      if (to.includes("BADGE_OUTLINE_CLASS")) used.push("BADGE_OUTLINE_CLASS");
      if (to.includes("BADGE_GHOST_CLASS")) used.push("BADGE_GHOST_CLASS");
    }
  }

  // Merge dual :class on same line and multiline
  content = content.replace(
    /:class="(\[[^\]]+\])"\s+:class="(\[[^\]]+\])"/gu,
    (_m, a: string, b: string) => {
      const ia = a.slice(1, -1).trim().replace(/,\s*$/u, "");
      const ib = b.slice(1, -1).trim().replace(/^,\s*/u, "");
      return `:class="[${ia}, ${ib}]"`;
    },
  );
  content = content.replace(
    /:class="(\[[\s\S]*?\])"\s*\n(\s*):class="(\[[\s\S]*?\])"/gu,
    (_m, a: string, _i: string, b: string) => {
      const ia = a.slice(1, -1).trim().replace(/,\s*$/u, "");
      const ib = b.slice(1, -1).trim().replace(/^,\s*/u, "");
      return `:class="[${ia}, ${ib}]"`;
    },
  );

  if (content === original) continue;
  content = ensureImport(content, used);
  writeFileSync(path, content);
  changed += 1;
}

writeFileSync(
  join(process.cwd(), "docs/ssot-ledger/badge-soft-pass2.txt"),
  `files_changed=${String(changed)}\n`,
);
