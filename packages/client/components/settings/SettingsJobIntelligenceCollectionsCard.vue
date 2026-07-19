<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MIN_HEIGHT_SCROLL_CLASS,
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
        <span class="badge badge-ghost badge-sm">
          {{ sourceCollectionCount }}
        </span>
      </div>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobProviderForm.greenhouseBoardsJson" :aria-label="t('settings.jobIntelligence.greenhouseBoardsLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_SCROLL_CLASS]"/>
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobProviderForm.leverCompaniesJson" :aria-label="t('settings.jobIntelligence.leverCompaniesLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_SCROLL_CLASS]"/>
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.companyBoardsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.companyBoardsLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobProviderForm.companyBoardsJson" :aria-label="t('settings.jobIntelligence.companyBoardsLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_SCROLL_CLASS]"/>
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobProviderForm.companyBoardApiTemplatesJson" :aria-label="t('settings.jobIntelligence.companyTemplatesLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_SCROLL_CLASS]"/>
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, PADDING_TOKEN_CLASS.pr10]">
            <span class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
              <span>{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobProviderForm.gamingPortalsJson" :aria-label="t('settings.jobIntelligence.gamingPortalsLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_SCROLL_CLASS]"/>
            </fieldset>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>
