<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { JobProviderForm, JobTaxonomyForm } from "./job-intelligence";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";

defineProps<{
  providerSaveState: SaveState;
  taxonomySaveState: SaveState;
}>();

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });
const jobTaxonomyForm = defineModel<JobTaxonomyForm>("jobTaxonomyForm", { required: true });

const emit = defineEmits<{
  saveProviders: [];
  saveTaxonomy: [];
}>();

const { t } = useI18n();

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

const taxonomyAssetCount = computed(
  () =>
    Number(jobTaxonomyForm.value.keywordsJson.trim().length > 0) +
    Number(jobTaxonomyForm.value.studioRulesJson.trim().length > 0),
);
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <div :class="SURFACE_GLASS_CARD_CLASS">
      <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
        <SettingsPanelHeader
          :title="t('settings.jobIntelligence.title')"
          :description="t('settings.jobIntelligence.subtitle')"
        />

        <div class="stats stats-vertical bg-base-200 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
          <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
            <div class="stat-title">{{ t("settings.jobIntelligence.summarySourcesTitle") }}</div>
            <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ configuredSourceCount }}</div>
            <div class="stat-desc">{{ t("settings.jobIntelligence.summarySourcesDescription") }}</div>
          </div>

          <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
            <div class="stat-title">{{ t("settings.jobIntelligence.summaryCollectionsTitle") }}</div>
            <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ sourceCollectionCount }}</div>
            <div class="stat-desc">{{ t("settings.jobIntelligence.summaryCollectionsDescription") }}</div>
          </div>

          <div class="stat" :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]">
            <div class="stat-title">{{ t("settings.jobIntelligence.summaryTaxonomyTitle") }}</div>
            <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ taxonomyAssetCount }}</div>
            <div class="stat-desc">{{ t("settings.jobIntelligence.summaryTaxonomyDescription") }}</div>
          </div>
        </div>
      </div>
    </div>

    <SettingsJobIntelligenceProvidersWorkspace
      v-model:job-provider-form="jobProviderForm"
      :provider-save-state="providerSaveState"
      @save="emit('saveProviders')"
    />

    <SettingsJobIntelligenceTaxonomyWorkspace
      v-model:job-taxonomy-form="jobTaxonomyForm"
      :taxonomy-save-state="taxonomySaveState"
      @save="emit('saveTaxonomy')"
    />
  </div>
</template>
