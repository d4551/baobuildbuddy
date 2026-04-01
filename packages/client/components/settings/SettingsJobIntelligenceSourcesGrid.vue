<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { JobProviderForm } from "./job-intelligence";

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });

const { t } = useI18n();

function providerBadgeClass(isConfigured: boolean): string {
  return isConfigured ? "badge-success" : "badge-warning";
}

function providerBadgeLabel(isConfigured: boolean): string {
  return isConfigured
    ? t("settings.jobIntelligence.configuredBadge")
    : t("settings.jobIntelligence.needsAttentionBadge");
}
</script>

<template>
  <SectionGrid grid-token="threeColumn">
    <article class="card card-border bg-base-200/60">
      <div class="card-body gap-4 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="card-title text-base">{{ t("settings.jobIntelligence.hitmarkerTitle") }}</h3>
            <p class="text-sm text-base-content/60">
              {{ t("settings.jobIntelligence.hitmarkerDescription") }}
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="providerBadgeClass(jobProviderForm.hitmarkerEnabled && jobProviderForm.hitmarkerApiBaseUrl.trim().length > 0)"
          >
            {{
              providerBadgeLabel(
                jobProviderForm.hitmarkerEnabled &&
                  jobProviderForm.hitmarkerApiBaseUrl.trim().length > 0,
              )
            }}
          </span>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerApiLabel") }}</legend>
          <input
            v-model="jobProviderForm.hitmarkerApiBaseUrl"
            :aria-label="t('settings.jobIntelligence.hitmarkerApiLabel')"
            type="url"
            class="input w-full"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerQueryLabel") }}</legend>
          <input
            v-model="jobProviderForm.hitmarkerDefaultQuery"
            :aria-label="t('settings.jobIntelligence.hitmarkerQueryLabel')"
            type="text"
            class="input w-full"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerLocationLabel") }}</legend>
          <input
            v-model="jobProviderForm.hitmarkerDefaultLocation"
            :aria-label="t('settings.jobIntelligence.hitmarkerLocationLabel')"
            type="text"
            class="input w-full"
          />
        </fieldset>
      </div>
    </article>

    <article class="card card-border bg-base-200/60">
      <div class="card-body gap-4 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="card-title text-base">{{ t("settings.jobIntelligence.greenhouseTitle") }}</h3>
            <p class="text-sm text-base-content/60">
              {{ t("settings.jobIntelligence.greenhouseDescription") }}
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="providerBadgeClass(jobProviderForm.greenhouseApiBaseUrl.trim().length > 0)"
          >
            {{ providerBadgeLabel(jobProviderForm.greenhouseApiBaseUrl.trim().length > 0) }}
          </span>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.greenhouseApiLabel") }}</legend>
          <input
            v-model="jobProviderForm.greenhouseApiBaseUrl"
            :aria-label="t('settings.jobIntelligence.greenhouseApiLabel')"
            type="url"
            class="input w-full"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.greenhouseMaxPagesLabel") }}</legend>
          <input
            v-model.number="jobProviderForm.greenhouseMaxPages"
            :aria-label="t('settings.jobIntelligence.greenhouseMaxPagesLabel')"
            type="number"
            min="1"
            max="20"
            class="input w-full"
          />
        </fieldset>
      </div>
    </article>

    <article class="card card-border bg-base-200/60">
      <div class="card-body gap-4 p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="card-title text-base">{{ t("settings.jobIntelligence.leverTitle") }}</h3>
            <p class="text-sm text-base-content/60">
              {{ t("settings.jobIntelligence.leverDescription") }}
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="providerBadgeClass(jobProviderForm.leverApiBaseUrl.trim().length > 0)"
          >
            {{ providerBadgeLabel(jobProviderForm.leverApiBaseUrl.trim().length > 0) }}
          </span>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.leverApiLabel") }}</legend>
          <input
            v-model="jobProviderForm.leverApiBaseUrl"
            :aria-label="t('settings.jobIntelligence.leverApiLabel')"
            type="url"
            class="input w-full"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.leverMaxPagesLabel") }}</legend>
          <input
            v-model.number="jobProviderForm.leverMaxPages"
            :aria-label="t('settings.jobIntelligence.leverMaxPagesLabel')"
            type="number"
            min="1"
            max="20"
            class="input w-full"
          />
        </fieldset>
      </div>
    </article>
  </SectionGrid>
</template>
