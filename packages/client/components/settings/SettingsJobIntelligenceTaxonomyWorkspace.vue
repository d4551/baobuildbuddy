<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, SURFACE_GLASS_CARD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";
import type { SaveState } from "~/components/settings/save-state";
import type { JobTaxonomyForm } from "./job-intelligence";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import { getSaveStateBadgeClass, getSaveStateLabelKey } from "./save-state";

const props = defineProps<{
  taxonomySaveState: SaveState;
}>();

const jobTaxonomyForm = defineModel<JobTaxonomyForm>("jobTaxonomyForm", { required: true });

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
  <div class="card card-border bg-base-100">
    <div class="card-body gap-6">
      <SettingsPanelHeader
        :title="t('settings.jobIntelligence.taxonomyTitle')"
        :description="t('settings.jobIntelligence.taxonomyDescription')"
      >
        <template #meta>
          <div class="flex flex-wrap items-center justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="badge badge-neutral badge-sm" :aria-label="t('settings.jobIntelligence.summaryTaxonomyTitle')">
              {{ populatedTaxonomyCount }}/2
            </span>
            <span
              v-if="taxonomySaveStateLabelKey"
              class="badge badge-sm"
              :class="getSaveStateBadgeClass(taxonomySaveState)"
            >
              {{ t(taxonomySaveStateLabelKey) }}
            </span>
            <button
              class="btn btn-secondary btn-sm"
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
        <article :class="SURFACE_GLASS_CARD_CLASS">
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div class="space-y-1">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</h3>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("settings.jobIntelligence.taxonomyKeywordsDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</legend>
              <textarea
                v-model="jobTaxonomyForm.keywordsJson"
                :aria-label="t('settings.jobIntelligence.taxonomyKeywordsLabel')"
                class="textarea min-h-64 font-mono" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]"
              />
            </fieldset>
          </div>
        </article>

        <article :class="SURFACE_GLASS_CARD_CLASS">
          <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
            <div class="space-y-1">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</h3>
              <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ t("settings.jobIntelligence.taxonomyStudiosDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</legend>
              <textarea
                v-model="jobTaxonomyForm.studioRulesJson"
                :aria-label="t('settings.jobIntelligence.taxonomyStudiosLabel')"
                class="textarea min-h-64 font-mono" :class="[FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]"
              />
            </fieldset>
          </div>
        </article>
      </SectionGrid>
    </div>
  </div>
</template>
