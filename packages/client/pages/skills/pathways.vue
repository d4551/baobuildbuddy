<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useSkillsPathwaysPage } from "~/composables/useSkillsPathwaysPage";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});
const { t } = useI18n();
const page = await useSkillsPathwaysPage();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("skillsPathwaysPage.seoTitle"),
    description: t("skillsPathwaysPage.seoDescription"),
  });
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="skills-pathways-title">
    <AppBreadcrumbs :crumbs="page.breadcrumbs" />

    <PageHeroHeader
      title-id="skills-pathways-title"
      :title="t('skillsPathwaysPage.title')"
      :description="t('skillsPathwaysPage.subtitle')"
    >
      <template #actions>
        <NuxtLink
          v-if="page.gamificationReady"
          :to="APP_ROUTES.gamification"
          class="btn btn-ghost"
          :aria-label="t('skillsPathwaysPage.gamification.openProgressAria')"
        >
          <span class="badge badge-primary badge-sm">
            {{ t("skillsPathwaysPage.gamification.levelLabel", { level: page.gamificationLevel }) }}
          </span>
          <span class="text-xs">{{ t("skillsPathwaysPage.gamification.xpLabel", { xp: page.gamificationXP }) }}</span>
        </NuxtLink>
        <span
          v-else-if="page.gamificationStatus === 'pending' || page.gamificationStatus === 'idle'"
          class="badge badge-ghost badge-sm"
        >
          {{ t("skillsPathwaysPage.gamification.unavailableHint") }}
        </span>
      </template>
    </PageHeroHeader>

    <BootstrapErrorAlert
      v-if="page.gamificationStatus === 'error'"
      severity="warning"
      :message="getErrorMessage(page.gamificationError, t('skillsPathwaysPage.errors.gamificationLoadFailed'))"
      :retry-label="t('skillsPathwaysPage.gamification.retryButton')"
      :retry-aria-label="t('skillsPathwaysPage.gamification.retryAria')"
      @retry="() => page.refreshGamificationProgress()"
    />

    <LoadingSkeleton v-if="page.uiState === 'loading'" variant="cards" :lines="8" />

    <BootstrapErrorAlert
      v-else-if="page.uiState === 'error'"
      :message="getErrorMessage(page.error, t('skillsPathwaysPage.errors.loadFailed'))"
      :retry-label="t('skillsPathwaysPage.retryButtonLabel')"
      :retry-aria-label="t('skillsPathwaysPage.retryAria')"
      @retry="page.retryLoad"
    />

    <EmptyState
      v-else-if="page.uiState === 'empty'"
      title-key="skillsPathwaysPage.pathways.emptyStateTitle"
      description-key="skillsPathwaysPage.pathways.emptyStateDescription"
      cta-label-key="nav.skills"
      :cta-to="APP_ROUTES.skills"
    />

    <template v-else>
      <SkillsPathwaysReadinessCard
        :readiness-assessment="page.readinessAssessment"
        :readiness-categories="page.readinessCategories"
        :readiness-min="page.readinessMin"
        :readiness-max="page.readinessMax"
        :get-category-label="page.getCategoryLabel"
        :get-category-feedback-label="page.getCategoryFeedbackLabel"
        :get-readiness-improvement-label="page.getReadinessImprovementLabel"
        :get-readiness-next-step-label="page.getReadinessNextStepLabel"
        :get-readiness-color="page.getReadinessColor"
        :get-readiness-dial-style="page.getReadinessDialStyle"
      />

      <SkillsPathwaysGrid
        :pathways="page.sortedPathways"
        :readiness-max="page.readinessMax"
        :get-pathway-icon="page.getPathwayIcon"
        :get-readiness-badge-color="page.getReadinessBadgeColor"
        :get-readiness-color="page.getReadinessColor"
      />
    </template>
  </PageScaffold>
</template>
