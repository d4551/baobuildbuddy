<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MIN_HEIGHT_EDITOR_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_NEUTRAL_SM_CLASS,
  BADGE_SM_CLASS,
} from "~/constants/layout-badges";
import {
  SECONDARY_ACTION_DENSE_CLASS,
} from "~/constants/layout-action-soft";
import type { JobTaxonomyForm } from "./job-intelligence";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import { getSaveStateBadgeClass, getSaveStateLabelKey } from "./save-state";

const jobTaxonomyForm = defineModel<JobTaxonomyForm>("jobTaxonomyForm", { required: true });

const props = defineProps<{
  taxonomySaveState: SaveState;
}>();

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();

const taxonomySaveStateLabelKey = computed(() => getSaveStateLabelKey(props.taxonomySaveState));

const populatedTaxonomyCount = computed(
  () =>
    Number(jobTaxonomyForm.value.keywordsJson.trim().length > 0) +
    Number(jobTaxonomyForm.value.studioRulesJson.trim().length > 0),
);
</script>

<template>
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
      <SettingsPanelHeader
        :title="t('settings.jobIntelligence.taxonomyTitle')"
        :description="t('settings.jobIntelligence.taxonomyDescription')"
      >
        <template #meta>
          <div class="flex flex-wrap items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span :class="[BADGE_NEUTRAL_SM_CLASS]" :aria-label="t('settings.jobIntelligence.summaryTaxonomyTitle')">
              {{ populatedTaxonomyCount }}/2
            </span>
            <span 
              v-if="taxonomySaveStateLabelKey"
              :class="[BADGE_SM_CLASS, getSaveStateBadgeClass(taxonomySaveState)]"
            >
              {{ t(taxonomySaveStateLabelKey) }}
            </span>
            <button type="button" 
              :class="[TOUCH_TARGET_MIN_CLASS, SECONDARY_ACTION_DENSE_CLASS]"
              :aria-label="t('settings.jobIntelligence.saveTaxonomyAria')"
              @click="emit('save')"
            >
              {{
                taxonomySaveState === "saving"
                  ? t("settings.jobIntelligence.savingTaxonomy")
                  : t("settings.jobIntelligence.saveTaxonomy")
              }}
            </button>
          </div>
        </template>
      </SettingsPanelHeader>

      <SectionGrid grid-token="twoColumnWide">
        <UiGlassCard>
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</h3>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("settings.jobIntelligence.taxonomyKeywordsDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobTaxonomyForm.keywordsJson" :aria-label="t('settings.jobIntelligence.taxonomyKeywordsLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_EDITOR_CLASS]"/>
            </fieldset>
          </div>
        </UiGlassCard>

        <UiGlassCard>
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</h3>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("settings.jobIntelligence.taxonomyStudiosDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</legend>
              <textarea class="textarea font-mono" v-model="jobTaxonomyForm.studioRulesJson" :aria-label="t('settings.jobIntelligence.taxonomyStudiosLabel')" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs, MIN_HEIGHT_EDITOR_CLASS]"/>
            </fieldset>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
