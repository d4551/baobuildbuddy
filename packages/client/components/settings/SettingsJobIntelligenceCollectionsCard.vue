<script setup lang="ts">
import { useI18n } from "vue-i18n";
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
  <section class="card card-border bg-base-200/60" :aria-label="t('settings.jobIntelligence.advancedCollectionsTitle')">
    <div class="card-body gap-4 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <h3 class="card-title text-base">{{ t("settings.jobIntelligence.advancedCollectionsTitle") }}</h3>
          <p class="text-sm text-base-content/60">
            {{ t("settings.jobIntelligence.advancedCollectionsDescription") }}
          </p>
        </div>
        <span class="badge badge-ghost badge-sm">
          {{ sourceCollectionCount }}
        </span>
      </div>

      <div class="space-y-3">
        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title pr-10 text-sm font-medium">
            <span class="flex items-center gap-2">
              <span>{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</legend>
              <textarea
                v-model="jobProviderForm.greenhouseBoardsJson"
                :aria-label="t('settings.jobIntelligence.greenhouseBoardsLabel')"
                class="textarea min-h-40 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title pr-10 text-sm font-medium">
            <span class="flex items-center gap-2">
              <span>{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</legend>
              <textarea
                v-model="jobProviderForm.leverCompaniesJson"
                :aria-label="t('settings.jobIntelligence.leverCompaniesLabel')"
                class="textarea min-h-40 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title pr-10 text-sm font-medium">
            <span class="flex items-center gap-2">
              <span>{{ t("settings.jobIntelligence.companyBoardsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.companyBoardsLabel") }}</legend>
              <textarea
                v-model="jobProviderForm.companyBoardsJson"
                :aria-label="t('settings.jobIntelligence.companyBoardsLabel')"
                class="textarea min-h-40 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title pr-10 text-sm font-medium">
            <span class="flex items-center gap-2">
              <span>{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</legend>
              <textarea
                v-model="jobProviderForm.companyBoardApiTemplatesJson"
                :aria-label="t('settings.jobIntelligence.companyTemplatesLabel')"
                class="textarea min-h-40 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </details>

        <details class="collapse collapse-arrow border border-base-300 bg-base-100">
          <summary class="collapse-title pr-10 text-sm font-medium">
            <span class="flex items-center gap-2">
              <span>{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</span>
              <span class="badge badge-ghost badge-xs">{{ t("settings.jobIntelligence.advancedBadge") }}</span>
            </span>
          </summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</legend>
              <textarea
                v-model="jobProviderForm.gamingPortalsJson"
                :aria-label="t('settings.jobIntelligence.gamingPortalsLabel')"
                class="textarea min-h-40 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>
