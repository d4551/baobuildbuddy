import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const scanRoots = ["packages/client"] as const;

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-tokens.ts",
  "packages/client/constants/chat.ts",
  "packages/client/constants/ui-layout.ts",
  "packages/client/assets/css/main.css",
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/AppModalFrame.vue",
  "packages/client/components/ui/PageHeroHeader.vue",
  "packages/client/components/ui/PageHeaderBlock.vue",
  "packages/client/components/ui/BootstrapErrorAlert.vue",
  "packages/client/components/BootstrapErrorAlert.vue",
  "packages/client/components/ui/FilteredEmptyAlert.vue",
  "packages/client/components/ui/WorkspaceSectionNavigator.vue",
  "packages/client/components/ui/AIProviderIcon.vue",
  "packages/client/components/settings/brand/BrandPreviewCard.vue",
  "packages/client/components/automation/AutomationRunDetailScreenshotsCard.vue",
  "packages/client/components/automation/AutomationRunDetailTimelineCard.vue",
  "packages/client/components/automation/AutomationRunDetailStatsCard.vue",
  "packages/client/components/automation/AutomationScraperCapabilityCard.vue",
  "packages/client/components/automation/AutomationHubAuditCard.vue",
  "packages/client/components/ai/AIChatConversationPanel.vue",
  "packages/client/components/ai/FloatingChatPanel.vue",
  "packages/client/components/ai/ChatVoiceControls.vue",
  "packages/client/components/ai/FloatingChatToggleButton.vue",
  "packages/client/components/ai/AIChatSidebar.vue",
  "packages/client/components/ai/AIChatBubble.vue",
  "packages/client/components/interview/InterviewChat.vue",
  "packages/client/components/interview/InterviewSessionContent.vue",
  "packages/client/components/interview/InterviewSessionFeedbackCard.vue",
  "packages/client/components/interview/InterviewSessionContextCard.vue",
  "packages/client/components/interview/InterviewSessionOverviewCard.vue",
  "packages/client/components/interview/InterviewSessionPromptCard.vue",
  "packages/client/components/interview/InterviewHistoryDetailCard.vue",
  "packages/client/components/interview/InterviewRecentSessionsCard.vue",
  "packages/client/components/interview/InterviewHistorySessionsCard.vue",
  "packages/client/components/interview/InterviewConfigSessionFields.vue",
  "packages/client/components/interview/StudioSelector.vue",
  "packages/client/components/resume/ResumeEditorToolbar.vue",
  "packages/client/components/resume/ResumeBuildTargetCard.vue",
  "packages/client/components/resume/ResumeBuildQuestionsCard.vue",
  "packages/client/components/resume/ResumeBuildStatusCard.vue",
  "packages/client/components/resume/ResumeCompletionCard.vue",
  "packages/client/components/resume/ResumeEnhancementSteps.vue",
  "packages/client/components/resume/ResumeLibraryPanel.vue",
  "packages/client/components/resume/ResumeEditorPanels.vue",
  "packages/client/components/resume/ResumePreviewDocument.vue",
  "packages/client/components/resume/PersonalInfoForm.vue",
  "packages/client/components/resume/ResumeGamingFields.vue",
  "packages/client/components/resume/SkillsEditor.vue",
  "packages/client/components/gamification/DailyChallenge.vue",
  "packages/client/components/gamification/GamificationAchievementsCard.vue",
  "packages/client/components/gamification/GamificationChallengesCard.vue",
  "packages/client/components/gamification/GamificationSummaryCard.vue",
  "packages/client/components/gamification/AchievementBadge.vue",
  "packages/client/components/dashboard/DashboardWelcomeBanner.vue",
  "packages/client/components/dashboard/DashboardStatCardsGrid.vue",
  "packages/client/components/dashboard/DashboardQuickActionsCard.vue",
  "packages/client/components/dashboard/DashboardChallengeActivityGrid.vue",
  "packages/client/components/dashboard/DashboardGamificationCard.vue",
  "packages/client/components/dashboard/DashboardOnboardingCard.vue",
  "packages/client/components/skills/SkillsPageFilters.vue",
  "packages/client/components/skills/SkillsPageInsights.vue",
  "packages/client/components/skills/SkillsPageMappings.vue",
  "packages/client/components/skills/SkillsPathwaysGrid.vue",
  "packages/client/components/skills/SkillsPathwaysReadinessCard.vue",
  "packages/client/components/setup/SetupAiConfigStep.vue",
  "packages/client/components/setup/SetupCompletionStep.vue",
  "packages/client/components/setup/SetupStepIndicator.vue",
  "packages/client/components/setup/SetupProfileStep.vue",
  "packages/client/components/portfolio/PortfolioProfileCard.vue",
  "packages/client/components/portfolio/PortfolioProjectsCard.vue",
  "packages/client/components/portfolio/PortfolioProjectModal.vue",
  "packages/client/components/jobs/JobDetailMainContent.vue",
  "packages/client/components/jobs/JobDetailSidebar.vue",
  "packages/client/components/jobs/JobMatchScore.vue",
  "packages/client/components/jobs/JobApplyDialog.vue",
  "packages/client/components/jobs/JobsPageFiltersCard.vue",
  "packages/client/components/studios/StudiosIndexGrid.vue",
  "packages/client/components/studios/StudiosIndexFiltersCard.vue",
  "packages/client/components/studios/StudiosPreviewModal.vue",
  "packages/client/components/cover-letter/CoverLetterPreviewCard.vue",
  "packages/client/components/cover-letter/CoverLetterEditorCard.vue",
  "packages/client/components/cover-letter/CoverLetterGenerateDialog.vue",
  "packages/client/components/cover-letter/CoverLetterDetailFormCard.vue",
  "packages/client/components/api-docs/ApiDocsEndpointNavigator.vue",
  "packages/client/components/api-docs/ApiDocsEndpointSections.vue",
  "packages/client/components/api-docs/ApiEndpointTesterDialog.vue",
  "packages/client/components/settings/brand/BrandContentTab.vue",
  "packages/client/components/settings/brand/BrandIdentityTab.vue",
  "packages/client/components/settings/brand/BrandThemesTab.vue",
  "packages/client/components/settings/brand/BrandStatsCard.vue",
  "packages/client/components/settings/brand/BrandTypographyTab.vue",
  "packages/client/components/settings/brand/BrandThemeSwatches.vue",
  "packages/client/components/settings/SettingsAiProviderAccordionList.vue",
  "packages/client/components/settings/SettingsAIProvidersPanel.vue",
  "packages/client/components/settings/SettingsAiRoutingCard.vue",
  "packages/client/components/settings/SettingsAutomationPanel.vue",
  "packages/client/components/settings/SettingsBrandPanel.vue",
  "packages/client/components/settings/SettingsEmailDeliveryPanel.vue",
  "packages/client/components/settings/SettingsJobIntelligencePanel.vue",
  "packages/client/components/settings/SettingsJobIntelligenceCollectionsCard.vue",
  "packages/client/components/settings/SettingsJobIntelligenceSourcesGrid.vue",
  "packages/client/components/settings/SettingsJobIntelligenceProvidersWorkspace.vue",
  "packages/client/components/settings/SettingsJobIntelligenceTaxonomyWorkspace.vue",
  "packages/client/components/settings/SettingsPanelHeader.vue",
  "packages/client/components/settings/SettingsPreferencesPanel.vue",
  "packages/client/components/settings/SettingsProfilePanel.vue",
  "packages/client/components/settings/SettingsSectionTabs.vue",
  "packages/client/components/ai/SpeechModelProfileFields.vue",
  "packages/client/components/interview/InterviewConfigModal.vue",
  "packages/client/components/automation/AutomationScraperCapabilityGrid.vue",
  "packages/client/components/automation/AutomationHubActionGrid.vue",
  "packages/client/components/automation/AutomationCoverageChips.vue",
  "packages/client/components/automation/AutomationRunDetailPayloadGrid.vue",
  "packages/client/components/automation/AutomationRunsTable.vue",
  "packages/client/components/automation/AutomationRunsFilters.vue",
  "packages/client/components/automation/AutomationJobApplyFormCard.vue",
  "packages/client/components/automation/AutomationJobApplyRunCard.vue",
  "packages/client/components/automation/AutomationJobApplyScheduledCard.vue",
  "packages/client/components/automation/AutomationScraperOverviewCard.vue",
  "packages/client/components/automation/AutomationScraperJobsCard.vue",
  "packages/client/components/common/AppExportMenu.vue",
  "packages/client/layouts/auth-shell.vue",
  "packages/client/layouts/default.vue",
  "packages/client/error.vue",
]);

const isSsotSourceFile = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);
const isIconPrimitive = (filePath: string): boolean =>
  filePath.startsWith("packages/client/components/icons/");

const rawPalettePattern =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/gu;
const rawMonochromePalettePattern = /\b(?:bg|text|border|fill)-(?:white|black)\b/gu;
const hexColorLiteralPattern = /#[0-9a-fA-F]{3,8}\b/gu;
const cssColorFunctionPattern = /\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/gu;

const arbitraryTokenPattern =
  /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|w|h|min-w|min-h|max-w|max-h|rounded|shadow)-\[[^\]]+\]/gu;

const inlineUtilityTokenPattern =
  /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|w|h|min-w|min-h|max-w|max-w|rounded)-(?:xs|sm|md|lg|xl|2xl|3xl|full|\d{1,3})\b/gu;
const inlineShadowTokenPattern = /\bshadow-(?:xs|sm|md|lg|xl|2xl|inner|none)\b/gu;
const inlineRadiusTokenPattern = /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/gu;
const inlineTypographyScalePattern =
  /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/gu;
const inlineResponsiveBreakpointBypassPattern =
  /\b(?:sm|md|lg|xl|2xl):(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|w|h|min-w|min-h|max-w|rounded|shadow|text)-[a-z0-9]+/gu;

const staticClassAttributePattern = /\bclass\s*=\s*["']([^"']+)["']/gu;
const designTokenPropDefaultPattern =
  /\b(?:sizeClass|trackClass|fillClass|widthClass|heightClass|radiusClass|spacingClass|paddingClass|gapClass)\s*:\s*["']([^"']+)["']/gu;

const svgNumericAttributePattern =
  /\b(?:stroke-width|width|height)\s*=\s*["'](\d+(?:\.\d+)?)["']/gu;
const svgTagPattern = /<(?:svg|circle|path|rect|line|polyline|polygon|ellipse|g)\b/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const extractScriptBlocks = (content: string): string => {
  const matches: string[] = [];
  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gu;
  for (const match of content.matchAll(scriptPattern)) {
    matches.push(match[1] ?? "");
  }
  return matches.join("\n");
};

const collectClassAttributeViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const patterns: Array<{ pattern: RegExp; message: (token: string) => string }> = [
    {
      pattern: rawPalettePattern,
      message: (token) =>
        `Raw Tailwind palette token "${token}" is forbidden. Use semantic daisyUI tokens or shared constants.`,
    },
    {
      pattern: rawMonochromePalettePattern,
      message: (token) =>
        `Raw monochrome palette token "${token}" is forbidden. Use bg-base-100 / text-base-content / text-muted semantic tokens.`,
    },
    {
      pattern: arbitraryTokenPattern,
      message: (token) =>
        `Arbitrary design token "${token}" is forbidden. Use the shared spacing and sizing scale.`,
    },
    {
      pattern: inlineUtilityTokenPattern,
      message: (token) =>
        `Inline utility token "${token}" is forbidden outside SSOT source. Add it to constants/layout.ts or constants/ui-layout.ts and reference the exported constant.`,
    },
    {
      pattern: inlineShadowTokenPattern,
      message: (token) =>
        `Inline shadow token "${token}" is forbidden. Use the .glass-* / --glass-shadow-* token system from main.css or a shared layout constant.`,
    },
    {
      pattern: inlineRadiusTokenPattern,
      message: (token) =>
        `Inline radius token "${token}" is forbidden. Use --radius-* CSS variables or a shared layout constant.`,
    },
    {
      pattern: inlineTypographyScalePattern,
      message: (token) =>
        `Inline typography scale token "${token}" is forbidden. Use a shared typography constant or semantic daisyUI class (text-base-content, text-muted, text-secondary).`,
    },
  ];

  staticClassAttributePattern.lastIndex = 0;
  for (const classMatch of content.matchAll(staticClassAttributePattern)) {
    const classValue = classMatch[1] ?? "";
    const baseLine = getLineFromOffset(content, classMatch.index ?? 0);
    for (const { pattern, message } of patterns) {
      pattern.lastIndex = 0;
      for (const tokenMatch of classValue.matchAll(pattern)) {
        const token = tokenMatch[0];
        if (
          token.includes("text-base") ||
          token.includes("text-muted") ||
          token.includes("text-secondary") ||
          token.includes("text-primary")
        ) {
          continue;
        }
        violations.push({ filePath, line: baseLine, message: message(token) });
      }
    }
  }

  return violations;
};

const collectResponsiveBypassViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const violations: ValidationViolation[] = [];
  inlineResponsiveBreakpointBypassPattern.lastIndex = 0;
  for (const match of content.matchAll(inlineResponsiveBreakpointBypassPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Responsive breakpoint utility "${match[0]}" bypasses the SSOT responsive token system. Add it to constants/ui-layout.ts as a UiGridToken/UiWidthToken/UiSpacingToken and reference the exported constant.`,
    });
  }
  return violations;
};

const collectDesignTokenPropDefaultViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const violations: ValidationViolation[] = [];
  designTokenPropDefaultPattern.lastIndex = 0;
  for (const match of content.matchAll(designTokenPropDefaultPattern)) {
    const value = match[1] ?? "";
    inlineUtilityTokenPattern.lastIndex = 0;
    if (inlineUtilityTokenPattern.test(value)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Design-token prop default "${value}" bakes in inline utility tokens. Import the size/radius/spacing constant from constants/layout.ts and use it as the default.`,
      });
    }
  }
  return violations;
};

const collectSvgNumericAttributeViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath) || isIconPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];
  svgNumericAttributePattern.lastIndex = 0;
  for (const match of template.matchAll(svgNumericAttributePattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hardcoded SVG numeric attribute "${match[0]}" is forbidden. Extract stroke-width / width / height into a named constant in constants/layout.ts or the component's primitive contract.`,
    });
  }
  return violations;
};

const collectColorLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  if (!filePath.endsWith(".css") && !filePath.endsWith(".vue") && !filePath.endsWith(".ts")) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  hexColorLiteralPattern.lastIndex = 0;
  for (const match of content.matchAll(hexColorLiteralPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hex color literal "${match[0]}" is forbidden. Use daisyUI semantic tokens (bg-base-*, text-base-content, text-muted, text-secondary, text-primary) or the main.css oklch() token system.`,
    });
  }
  cssColorFunctionPattern.lastIndex = 0;
  for (const match of content.matchAll(cssColorFunctionPattern)) {
    if (filePath.endsWith(".css") && isSsotSourceFile(filePath)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `CSS color function "${match[0]}" is forbidden outside main.css. Use daisyUI semantic tokens or the main.css token system.`,
    });
  }
  return violations;
};

export const collectRawDesignTokenViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const templateContent = extractTemplateBlocks(content);
  const classViolations =
    templateContent.length > 0 ? collectClassAttributeViolations(filePath, content) : [];
  const responsiveViolations = collectResponsiveBypassViolations(filePath, content);
  const propDefaultViolations = collectDesignTokenPropDefaultViolations(filePath, content);
  const svgViolations = collectSvgNumericAttributeViolations(filePath, content);
  const colorViolations = collectColorLiteralViolations(filePath, content);
  return [
    ...classViolations,
    ...responsiveViolations,
    ...propDefaultViolations,
    ...svgViolations,
    ...colorViolations,
  ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectRawDesignTokenViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Raw design token validation failed:",
    await collectViolations(),
    "Raw design token validation passed.",
  );
}
