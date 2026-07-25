<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppJsonField from "~/components/ui/AppJsonField.vue";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_GHOST_XS_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { JobProviderForm } from "./job-intelligence";

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });

const { t } = useI18n();

const sourceCollectionCount = computed(
  () =>
    [
      jobProviderForm.value.greenhouseBoardsJson,
      jobProviderForm.value.leverCompaniesJson,
      jobProviderForm.value.companyBoardsJson,
      jobProviderForm.value.companyBoardApiTemplatesJson,
      jobProviderForm.value.gamingPortalsJson,
    ].filter((value) => value.trim().length > 0).length,
);
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('settings.jobIntelligence.advancedCollectionsTitle')">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
          <h3 class="card-title text-base">{{ t("settings.jobIntelligence.advancedCollectionsTitle") }}</h3>
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.jobIntelligence.advancedCollectionsDescription") }}
          </p>
        </div>
        <span :class="BADGE_GHOST_SM_CLASS">
          {{ sourceCollectionCount }}
        </span>
      </div>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</span>
              <span :class="BADGE_GHOST_XS_CLASS">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <AppJsonField
              v-model="jobProviderForm.greenhouseBoardsJson"
              :label="t('settings.jobIntelligence.greenhouseBoardsLabel')"
              :aria-label="t('settings.jobIntelligence.greenhouseBoardsLabel')"
            />
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</span>
              <span :class="BADGE_GHOST_XS_CLASS">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <AppJsonField
              v-model="jobProviderForm.leverCompaniesJson"
              :label="t('settings.jobIntelligence.leverCompaniesLabel')"
              :aria-label="t('settings.jobIntelligence.leverCompaniesLabel')"
            />
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.companyBoardsLabel") }}</span>
              <span :class="BADGE_GHOST_XS_CLASS">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <AppJsonField
              v-model="jobProviderForm.companyBoardsJson"
              :label="t('settings.jobIntelligence.companyBoardsLabel')"
              :aria-label="t('settings.jobIntelligence.companyBoardsLabel')"
            />
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</span>
              <span :class="BADGE_GHOST_XS_CLASS">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <AppJsonField
              v-model="jobProviderForm.companyBoardApiTemplatesJson"
              :label="t('settings.jobIntelligence.companyTemplatesLabel')"
              :aria-label="t('settings.jobIntelligence.companyTemplatesLabel')"
            />
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</span>
              <span :class="BADGE_GHOST_XS_CLASS">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <AppJsonField
              v-model="jobProviderForm.gamingPortalsJson"
              :label="t('settings.jobIntelligence.gamingPortalsLabel')"
              :aria-label="t('settings.jobIntelligence.gamingPortalsLabel')"
            />
          </div>
        </details>
      </div>
    </div>
  </section>
</template>
