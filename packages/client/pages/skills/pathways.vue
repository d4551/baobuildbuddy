<script setup lang="ts">
import {
  LOADING_SKELETON_LINES,
} from "~/constants/numeric-ui";
defineOptions({ name: "PagesSkillsPathwaysPage" });

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { definePageMeta, useSeoMeta } from "#imports";
import { useSkillsPathwaysPage } from "~/composables/useSkillsPathwaysPage";
import {
  GHOST_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_PRIMARY_SM_CLASS,
} from "~/constants/layout-badges";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});
const { t } = useI18n();
const page = useSkillsPathwaysPage();

useSeoMeta({
  title: t("skillsPathwaysPage.seoTitle"),
  description: t("skillsPathwaysPage.seoDescription"),
});
</script>

<template>
  <PageScaffold tag="section" labelled-by="skills-pathways-title">
    <AppBreadcrumbs :crumbs="page.breadcrumbs.value" />

    <PageHeroHeader
      title-id="skills-pathways-title"
      :title="t('skillsPathwaysPage.title')"
      :description="t('skillsPathwaysPage.subtitle')"
    >
      <template #actions>
        <NuxtLink
          v-if="page.gamificationReady.value"
          :to="APP_ROUTES.gamification"
          :class="[GHOST_ACTION_CLASS]"
          :aria-label="t('skillsPathwaysPage.gamification.openProgressAria')"
        >
          <span :class="[BADGE_PRIMARY_SM_CLASS]">
            {{ t("skillsPathwaysPage.gamification.levelLabel", { level: page.gamificationLevel.value }) }}
          </span>
          <span :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{
            t("skillsPathwaysPage.gamification.xpLabel", { xp: page.gamificationXP.value })
          }}</span>
        </NuxtLink>
        <span
          v-else-if="
            page.gamificationStatus.value === 'pending' ||
              page.gamificationStatus.value === 'idle'
          "
          :class="[BADGE_GHOST_SM_CLASS]"
        >
          {{ t("skillsPathwaysPage.gamification.unavailableHint") }}
        </span>
      </template>
    </PageHeroHeader>

    <BootstrapErrorAlert
      v-if="page.gamificationStatus.value === 'error'"
      severity="warning"
      :message="
        getErrorMessage(
          page.gamificationError.value,
          t('skillsPathwaysPage.errors.gamificationLoadFailed'),
        )
      "
      :retry-label="t('skillsPathwaysPage.gamification.retryButton')"
      :retry-aria-label="t('skillsPathwaysPage.gamification.retryAria')"
      @retry="() => page.refreshGamificationProgress()"
    />

    <LoadingSkeleton v-if="page.uiState.value === 'loading'" variant="cards" :lines="LOADING_SKELETON_LINES.form" />

    <BootstrapErrorAlert
      v-else-if="page.uiState.value === 'error'"
      :message="getErrorMessage(page.error.value, t('skillsPathwaysPage.errors.loadFailed'))"
      :retry-label="t('skillsPathwaysPage.retryButtonLabel')"
      :retry-aria-label="t('skillsPathwaysPage.retryAria')"
      @retry="page.retryLoad"
    />

    <EmptyState
      v-else-if="page.uiState.value === 'empty'"
      title-key="skillsPathwaysPage.pathways.emptyStateTitle"
      description-key="skillsPathwaysPage.pathways.emptyStateDescription"
      cta-label-key="nav.skills"
      :cta-to="APP_ROUTES.skills"
    />

    <template v-else>
      <SkillsPathwaysReadinessCard
        :readiness-assessment="page.readinessAssessment.value"
        :readiness-categories="page.readinessCategories.value"
        :readiness-min="page.readinessMin"
        :readiness-max="page.readinessMax"
        :get-category-label="page.getCategoryLabel"
        :get-category-feedback-label="page.getCategoryFeedbackLabel"
        :get-readiness-improvement-label="page.getReadinessImprovementLabel"
        :get-readiness-next-step-label="page.getReadinessNextStepLabel"
        :get-readiness-color="page.getReadinessColor"
      />

      <SkillsPathwaysGrid
        :pathways="page.sortedPathways.value"
        :readiness-max="page.readinessMax"
        :get-pathway-icon="page.getPathwayIcon"
        :get-readiness-badge-color="page.getReadinessBadgeColor"
        :get-readiness-color="page.getReadinessColor"
      />
    </template>
  </PageScaffold>
</template>
