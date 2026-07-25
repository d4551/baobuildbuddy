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
import { countActiveJobProviderSources } from "~/utils/job-provider-source-count";
import type { JobProviderForm, JobTaxonomyForm } from "./job-intelligence";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });

const jobTaxonomyForm = defineModel<JobTaxonomyForm>("jobTaxonomyForm", { required: true });

defineProps<{
  providerSaveState: SaveState;
  taxonomySaveState: SaveState;
}>();

const emit = defineEmits<{
  saveProviders: [];
  saveTaxonomy: [];
}>();

const { t } = useI18n();

const configuredSourceCount = computed(() => countActiveJobProviderSources(jobProviderForm.value));

const sourceCollectionCount = computed(() => {
  const sources = [
    jobProviderForm.value.greenhouseBoardsJson,
    jobProviderForm.value.leverCompaniesJson,
    jobProviderForm.value.companyBoardsJson,
    jobProviderForm.value.companyBoardApiTemplatesJson,
    jobProviderForm.value.gamingPortalsJson,
  ];
  let count = 0;
  for (const source of sources) {
    if (source.trim().length > 0) {
      count += 1;
    }
  }
  return count;
});

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
        <SettingsPanelHeader />
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
