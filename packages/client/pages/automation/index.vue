<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  INSET_PANEL_MUTED_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS, APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "@bao/shared/constants/routes";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSeoMeta } from "#imports";
import {
  AUTOMATION_HUB_DEFAULT_SECTION_ID,
  AUTOMATION_HUB_SECTION_ITEMS,
  type AutomationHubSectionId,
  isAutomationHubSectionId,
} from "~/components/automation/hub-sections";
import { getErrorMessage } from "~/utils/errors";
import { resolveRouteSectionId } from "~/utils/route-query";

const { t } = useI18n();
const route = useRoute();
const page = useAutomationHubPage();
const {
  capabilityAuditError,
  capabilityAuditStatus,
  capabilityEntries,
  capabilitySummary,
  capabilityStatusClass,
  capabilityStatusLabel,
  error,
  nextPipelineStepLabel,
  orderedCards,
  pipelineSteps,
  primaryCard,
  primaryCardId,
  refreshCapabilityAudit,
  retryLoad,
  successRate,
  todayRuns,
  totalRuns,
  uiState,
} = {
  capabilityAuditError: page.capabilityAuditError,
  capabilityAuditStatus: page.capabilityAuditStatus,
  capabilityEntries: page.capabilityEntries,
  capabilitySummary: page.capabilitySummary,
  capabilityStatusClass: page.capabilityStatusClass,
  capabilityStatusLabel: page.capabilityStatusLabel,
  error: page.error,
  nextPipelineStepLabel: page.nextPipelineStepLabel,
  orderedCards: page.orderedCards,
  pipelineSteps: page.pipelineSteps,
  primaryCardId: page.primaryCardId,
  refreshCapabilityAudit: page.refreshCapabilityAudit,
  retryLoad: page.retryLoad,
  successRate: page.successRate,
  todayRuns: page.todayRuns,
  totalRuns: page.totalRuns,
  uiState: page.uiState,
};

const routeSection = computed<AutomationHubSectionId>(() =>
  resolveRouteSectionId(
    route.query[APP_ROUTE_QUERY_KEYS.section],
    isAutomationHubSectionId,
    AUTOMATION_HUB_DEFAULT_SECTION_ID,
  ),
);

const activeSection = ref<AutomationHubSectionId>(routeSection.value);

const readinessIssueCount = computed(() =>
  capabilityEntries.value
    ? capabilityEntries.value.filter((entry) => entry.issues.length > 0).length
    : 0,
);

const hubSectionBadgeById = computed<Record<AutomationHubSectionId, number>>(() => ({
  overview: totalRuns.value,
  readiness: readinessIssueCount.value,
  workflows: orderedCards.value.length,
}));

watch(
  routeSection,
  (value) => {
    activeSection.value = value;
  },
  { immediate: true },
);

useSeoMeta({
  title: t("automation.hub.pageTitle"),
  description: t("automation.hub.pageDescription"),
});
</script>

<template>
  <PageScaffold tag="section" labelled-by="automation-hub-title">
    <PageHeroHeader
      title-id="automation-hub-title"
      :title="t('automation.hub.title')"
      :description="t('automation.hub.pageDescription')"
    >
      <template #actions>
        <!-- Hero keeps sole primary; overview card demotes to outline. -->
        <NuxtLink
          :to="primaryCard?.to ?? APP_ROUTES.automationScraper"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t(primaryCard?.buttonKey ?? 'automation.hub.cards.scraper.button')"
        >
          {{ t(primaryCard?.buttonKey ?? "automation.hub.cards.scraper.button") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="uiState === 'loading' || uiState === 'idle'" variant="stats" :lines="4" />

    <BootstrapErrorAlert
      v-else-if="uiState === 'error'"
      :message="getErrorMessage(error, t('automation.hub.loadErrorFallback'))"
      :retry-label="t('automation.hub.retryButtonLabel')"
      :retry-aria-label="t('automation.hub.retryAria')"
      @retry="retryLoad"
    />

    <EmptyState
      v-else-if="uiState === 'empty'"
      title-key="automation.hub.emptyStateTitle"
      description-key="automation.hub.emptyStateDescription"
      cta-label-key="automation.hub.emptyStateCta"
      :cta-to="APP_ROUTES.automationScraper"
    />

    <template v-else>
      <WorkspaceSectionNavigator
        :sections="AUTOMATION_HUB_SECTION_ITEMS"
        :active-section="activeSection"
        v-bind="{ ariaLabelKey: 'automation.hub.sections.aria' }"
        :build-route="APP_ROUTE_BUILDERS.automationHubSection"
        :badge-by-id="hubSectionBadgeById"
        omit-active-heading-below-lg
      >
        <template v-if="activeSection === 'overview'">
          <StatsRow
            background-class="border border-base-300 bg-base-200"
            :stats="[
              { titleKey: 'automation.hub.stats.totalRunsTitle', value: totalRuns, descKey: 'automation.hub.stats.totalRunsDescription' },
              { titleKey: 'automation.hub.stats.todayRunsTitle', value: todayRuns, descKey: 'automation.hub.stats.todayRunsDescription' },
              { titleKey: 'automation.hub.stats.successRateTitle', value: `${successRate}%`, descKey: 'automation.hub.stats.successRateDescription' },
            ]"
          />

          <SectionGrid grid-token="twoColumnWide">
            <section :class="SURFACE_GLASS_CARD_CLASS" aria-labelledby="automation-next-action-title">
              <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
                <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
                  <h2 id="automation-next-action-title" class="card-title">
                    {{ t("automation.hub.nextAction.title") }}
                  </h2>
                  <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                    {{ t("automation.hub.nextAction.description") }}
                  </p>
                </div>
 <div :class="[INSET_PANEL_MUTED_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3, PADDING_TOKEN_CLASS.p4]">
                  <p class="font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                    {{ nextPipelineStepLabel }}
                  </p>
                  <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                    {{ t(primaryCard?.descriptionKey ?? "automation.hub.cards.scraper.description") }}
                  </p>
                  <div class="card-actions justify-end">
                    <NuxtLink
                      :to="primaryCard?.to ?? APP_ROUTES.automationScraper"
                      :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
                      :aria-label="t(primaryCard?.buttonKey ?? 'automation.hub.cards.scraper.button')"
                    >
                      {{ t(primaryCard?.buttonKey ?? "automation.hub.cards.scraper.button") }}
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </section>

            <WorkPipeline
              :title="t('automation.hub.pipelineTitle')"
              :description="t('automation.hub.pipelineDescription')"
              :aria-label="t('automation.hub.pipelineAria')"
              :steps="pipelineSteps"
              :next-step-label="nextPipelineStepLabel"
            />
          </SectionGrid>
        </template>

        <AutomationHubAuditCard
          v-else-if="activeSection === 'readiness'"
          :capability-audit-status="capabilityAuditStatus"
          :capability-audit-error="capabilityAuditError"
          :capability-summary="capabilitySummary"
          :capability-entries="capabilityEntries"
          :capability-status-class="capabilityStatusClass"
          :capability-status-label="capabilityStatusLabel"
          @retry="refreshCapabilityAudit"
        />

        <AutomationHubActionGrid
          v-else
          :ordered-cards="orderedCards"
          :primary-card-id="primaryCardId"
        />
      </WorkspaceSectionNavigator>
    </template>
  </PageScaffold>
</template>
