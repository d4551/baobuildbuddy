/**
 * Components that own canonical UI control / surface primitives.
 * Only these (plus UI_SSOT_AUTHORITY_PATHS) may appear in validator exemption Sets.
 * Feature-tree consumers (ai/, interview/, pages/, …) must never be exempted.
 */

const ICON_PRIMITIVE_PREFIX = "packages/client/components/icons/";

/**
 * Exact-path owners for validators that exempt a closed primitive set.
 * Softening ban: no blanket `components/ui/` prefix — every primitive is listed.
 */
export const CONTROL_PRIMITIVE_OWNERS = new Set<string>([
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/AppModalFrame.vue",
  "packages/client/components/ui/PageHeroHeader.vue",
  "packages/client/components/ui/PageHeaderBlock.vue",
  "packages/client/components/ui/BootstrapErrorAlert.vue",
  "packages/client/components/ui/AppPagination.vue",
  "packages/client/components/ui/ToastContainer.vue",
  "packages/client/components/ui/StatsRow.vue",
  "packages/client/components/ui/WorkPipeline.vue",
  "packages/client/components/ui/AppBreadcrumbs.vue",
  "packages/client/components/ui/LoadingSpinner.vue",
  "packages/client/components/ui/UiRadialMeter.vue",
  "packages/client/components/ui/ConfirmDialog.vue",
  "packages/client/components/ui/UiGlassCard.vue",
  "packages/client/components/ui/UiSearchFilterBar.vue",
  "packages/client/components/ui/QuickActionFab.vue",
  "packages/client/components/ui/AIProviderIcon.vue",
  "packages/client/components/ui/CloseIcon.vue",
  "packages/client/components/ui/ResponsiveDataSurface.vue",
  "packages/client/components/ui/WorkspaceSectionNavigator.vue",
]);

export const isControlPrimitiveOwner = (filePath: string): boolean =>
  CONTROL_PRIMITIVE_OWNERS.has(filePath) || filePath.startsWith(ICON_PRIMITIVE_PREFIX);

/** True when a path is a forbidden consumer exemption target. */
export const isForbiddenConsumerExemptionPath = (filePath: string): boolean => {
  if (filePath.startsWith("packages/client/pages/")) return true;
  if (filePath.startsWith("packages/client/layouts/")) return true;
  if (filePath.startsWith("packages/client/composables/")) return true;
  if (filePath.startsWith("packages/client/components/")) {
    return !isControlPrimitiveOwner(filePath);
  }
  return false;
};

/** Feature-tree prefix waivers that must never appear in validators. */
export const FORBIDDEN_FEATURE_TREE_PREFIXES = [
  "packages/client/components/cover-letter/",
  "packages/client/components/settings/",
  "packages/client/components/studios/",
  "packages/client/components/gamification/",
  "packages/client/components/dashboard/",
  "packages/client/components/ai/",
  "packages/client/components/interview/",
  "packages/client/components/resume/",
  "packages/client/components/portfolio/",
  "packages/client/components/skills/",
  "packages/client/components/setup/",
  "packages/client/components/jobs/",
  "packages/client/components/automation/",
  "packages/client/components/api-docs/",
  "packages/client/components/common/",
  "packages/client/components/layout/",
  "packages/client/pages/",
] as const;
