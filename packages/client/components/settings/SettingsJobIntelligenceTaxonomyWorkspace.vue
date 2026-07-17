<script setup lang="ts">
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
          <div class="flex flex-wrap items-center justify-end gap-2">
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
        <article class="card card-border card-glass">
          <div class="card-body gap-4 p-4">
            <div class="space-y-1">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</h3>
              <p class="text-sm text-muted">
                {{ t("settings.jobIntelligence.taxonomyKeywordsDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</legend>
              <textarea
                v-model="jobTaxonomyForm.keywordsJson"
                :aria-label="t('settings.jobIntelligence.taxonomyKeywordsLabel')"
                class="textarea min-h-64 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </article>

        <article class="card card-border card-glass">
          <div class="card-body gap-4 p-4">
            <div class="space-y-1">
              <h3 class="card-title text-base">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</h3>
              <p class="text-sm text-muted">
                {{ t("settings.jobIntelligence.taxonomyStudiosDescription") }}
              </p>
            </div>

            <fieldset class="fieldset">
              <legend class="sr-only">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</legend>
              <textarea
                v-model="jobTaxonomyForm.studioRulesJson"
                :aria-label="t('settings.jobIntelligence.taxonomyStudiosLabel')"
                class="textarea min-h-64 w-full font-mono text-xs"
              />
            </fieldset>
          </div>
        </article>
      </SectionGrid>
    </div>
  </div>
</template>
