<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
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
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body gap-6">
      <SettingsPanelHeader
        :title="t('settings.jobIntelligence.providersTitle')"
        :description="t('settings.jobIntelligence.providersDescription')"
      >
        <template #meta>
          <div class="flex flex-wrap items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
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

      <div class="stats stats-vertical bg-base-200 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.summarySourcesTitle") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ configuredSourceCount }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.summarySourcesDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.summaryCollectionsTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ sourceCollectionCount }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.summaryCollectionsDescription") }}</div>
        </div>

        <div class="stat px-4 py-3">
          <div class="stat-title">{{ t("settings.jobIntelligence.defaultsTitle") }}</div>
          <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ jobProviderForm.providerTimeoutMs }}</div>
          <div class="stat-desc">{{ t("settings.jobIntelligence.defaultsDescription") }}</div>
        </div>
      </div>

      <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('settings.jobIntelligence.defaultsTitle')">
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
          <div class="space-y-1">
            <h3 class="card-title text-base">{{ t("settings.jobIntelligence.defaultsTitle") }}</h3>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
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
                class="input" :class="[FLUID_WIDTH_CLASS]"
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
                class="input" :class="[FLUID_WIDTH_CLASS]"
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
                class="input" :class="[FLUID_WIDTH_CLASS]"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownLocationLabel") }}</legend>
              <input
                v-model="jobProviderForm.unknownLocationLabel"
                :aria-label="t('settings.jobIntelligence.unknownLocationLabel')"
                type="text"
                class="input" :class="[FLUID_WIDTH_CLASS]"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownCompanyLabel") }}</legend>
              <input
                v-model="jobProviderForm.unknownCompanyLabel"
                :aria-label="t('settings.jobIntelligence.unknownCompanyLabel')"
                type="text"
                class="input" :class="[FLUID_WIDTH_CLASS]"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerEnabledLabel") }}</legend>
              <label class="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-4 py-3" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
                <span class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
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
