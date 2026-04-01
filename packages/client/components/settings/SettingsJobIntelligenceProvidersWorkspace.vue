<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import type { JobProviderForm } from "./job-intelligence";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import { getSaveStateBadgeClass, getSaveStateLabelKey } from "./save-state";

const props = defineProps<{
  providerSaveState: SaveState;
}>();

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();

const providerSaveStateLabelKey = computed(() => getSaveStateLabelKey(props.providerSaveState));

const configuredSourceCount = computed(
  () =>
    Number(jobProviderForm.value.hitmarkerEnabled) +
    Number(jobProviderForm.value.greenhouseApiBaseUrl.trim().length > 0) +
    Number(jobProviderForm.value.leverApiBaseUrl.trim().length > 0),
);

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
  <div class="card card-border bg-base-100">
    <div class="card-body gap-6">
      <SettingsPanelHeader
        :title="t('settings.jobIntelligence.providersTitle')"
        :description="t('settings.jobIntelligence.providersDescription')"
      >
        <template #meta>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="badge badge-neutral badge-sm" :aria-label="t('settings.jobIntelligence.summarySourcesTitle')">
              {{ configuredSourceCount }}/3
            </span>
            <span
              v-if="providerSaveStateLabelKey"
              class="badge badge-sm"
              :class="getSaveStateBadgeClass(providerSaveState)"
            >
              {{ t(providerSaveStateLabelKey) }}
            </span>
            <button
              class="btn btn-primary btn-sm"
              :aria-label="t('settings.jobIntelligence.saveProvidersAria')"
              @click="emit('save')"
            >
              {{
                providerSaveState === "saving"
                  ? t("settings.jobIntelligence.savingProviders")
                  : t("settings.jobIntelligence.saveProviders")
              }}
            </button>
          </div>
        </template>
      </SettingsPanelHeader>

      <div class="stats stats-vertical w-full bg-base-200 shadow-sm lg:stats-horizontal">
        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.summarySourcesTitle") }}</div>
          <div class="stat-value text-primary text-2xl">{{ configuredSourceCount }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.summarySourcesDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.summaryCollectionsTitle") }}</div>
          <div class="stat-value text-2xl">{{ sourceCollectionCount }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.summaryCollectionsDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.defaultsTitle") }}</div>
          <div class="stat-value text-2xl">{{ jobProviderForm.providerTimeoutMs }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.defaultsDescription") }}</div>
        </div>
      </div>

      <section class="card card-border bg-base-200/60" :aria-label="t('settings.jobIntelligence.defaultsTitle')">
        <div class="card-body gap-4 p-4">
          <div class="space-y-1">
            <h3 class="card-title text-base">{{ t("settings.jobIntelligence.defaultsTitle") }}</h3>
            <p class="text-sm text-base-content/60">
              {{ t("settings.jobIntelligence.defaultsDescription") }}
            </p>
          </div>

          <SectionGrid grid-token="twoColumnWide">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.providerTimeoutLabel") }}</legend>
              <input
                v-model.number="jobProviderForm.providerTimeoutMs"
                :aria-label="t('settings.jobIntelligence.providerTimeoutLabel')"
                type="number"
                min="100"
                max="60000"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.companyLimitLabel") }}</legend>
              <input
                v-model.number="jobProviderForm.companyBoardResultLimit"
                :aria-label="t('settings.jobIntelligence.companyLimitLabel')"
                type="number"
                min="1"
                max="200"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.gamingLimitLabel") }}</legend>
              <input
                v-model.number="jobProviderForm.gamingBoardResultLimit"
                :aria-label="t('settings.jobIntelligence.gamingLimitLabel')"
                type="number"
                min="1"
                max="200"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownLocationLabel") }}</legend>
              <input
                v-model="jobProviderForm.unknownLocationLabel"
                :aria-label="t('settings.jobIntelligence.unknownLocationLabel')"
                type="text"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownCompanyLabel") }}</legend>
              <input
                v-model="jobProviderForm.unknownCompanyLabel"
                :aria-label="t('settings.jobIntelligence.unknownCompanyLabel')"
                type="text"
                class="input w-full"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerEnabledLabel") }}</legend>
              <label class="flex items-center justify-between gap-4 rounded-box border border-base-300 bg-base-100 px-4 py-3">
                <span class="text-sm text-base-content/70">
                  {{ t("settings.jobIntelligence.hitmarkerEnabledHint") }}
                </span>
                <input
                  v-model="jobProviderForm.hitmarkerEnabled"
                  :aria-label="t('settings.jobIntelligence.hitmarkerEnabledLabel')"
                  type="checkbox"
                  class="toggle toggle-primary"
                />
              </label>
            </fieldset>
          </SectionGrid>
        </div>
      </section>

      <SettingsJobIntelligenceSourcesGrid v-model:job-provider-form="jobProviderForm" />

      <SettingsJobIntelligenceCollectionsCard v-model:job-provider-form="jobProviderForm" />
    </div>
  </div>
</template>
