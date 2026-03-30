<script setup lang="ts">
import type { SaveState } from "~/components/settings/save-state";
import { useI18n } from "vue-i18n";

defineProps<{
  providerSaveState: SaveState;
  taxonomySaveState: SaveState;
}>();

const jobProviderForm = defineModel<{
  providerTimeoutMs: number;
  companyBoardResultLimit: number;
  gamingBoardResultLimit: number;
  unknownLocationLabel: string;
  unknownCompanyLabel: string;
  hitmarkerEnabled: boolean;
  hitmarkerApiBaseUrl: string;
  hitmarkerDefaultQuery: string;
  hitmarkerDefaultLocation: string;
  greenhouseApiBaseUrl: string;
  greenhouseMaxPages: number;
  leverApiBaseUrl: string;
  leverMaxPages: number;
  greenhouseBoardsJson: string;
  leverCompaniesJson: string;
  companyBoardsJson: string;
  companyBoardApiTemplatesJson: string;
  gamingPortalsJson: string;
}>("jobProviderForm", { required: true });

const jobTaxonomyForm = defineModel<{
  keywordsJson: string;
  studioRulesJson: string;
}>("jobTaxonomyForm", { required: true });

const emit = defineEmits<{
  saveProviders: [];
  saveTaxonomy: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body gap-6">
      <div>
        <h2 class="card-title">{{ t("settings.jobIntelligence.title") }}</h2>
        <p class="text-sm text-base-content/70">
          {{ t("settings.jobIntelligence.subtitle") }}
        </p>
      </div>

      <div class="space-y-4">
        <h3 class="font-semibold text-base">{{ t("settings.jobIntelligence.providersTitle") }}</h3>
        <SectionGrid>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.providerTimeoutLabel") }}</legend>
            <input v-model.number="jobProviderForm.providerTimeoutMs" :aria-label="t('settings.jobIntelligence.providerTimeoutLabel')" type="number" min="100" max="60000" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.companyLimitLabel") }}</legend>
            <input v-model.number="jobProviderForm.companyBoardResultLimit" :aria-label="t('settings.jobIntelligence.companyLimitLabel')" type="number" min="1" max="200" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.gamingLimitLabel") }}</legend>
            <input v-model.number="jobProviderForm.gamingBoardResultLimit" :aria-label="t('settings.jobIntelligence.gamingLimitLabel')" type="number" min="1" max="200" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerEnabledLabel") }}</legend>
            <input v-model="jobProviderForm.hitmarkerEnabled" :aria-label="t('settings.jobIntelligence.hitmarkerEnabledLabel')" type="checkbox" class="toggle toggle-primary mt-2" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownLocationLabel") }}</legend>
            <input v-model="jobProviderForm.unknownLocationLabel" :aria-label="t('settings.jobIntelligence.unknownLocationLabel')" type="text" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.unknownCompanyLabel") }}</legend>
            <input v-model="jobProviderForm.unknownCompanyLabel" :aria-label="t('settings.jobIntelligence.unknownCompanyLabel')" type="text" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerApiLabel") }}</legend>
            <input v-model="jobProviderForm.hitmarkerApiBaseUrl" :aria-label="t('settings.jobIntelligence.hitmarkerApiLabel')" type="url" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerQueryLabel") }}</legend>
            <input v-model="jobProviderForm.hitmarkerDefaultQuery" :aria-label="t('settings.jobIntelligence.hitmarkerQueryLabel')" type="text" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.hitmarkerLocationLabel") }}</legend>
            <input v-model="jobProviderForm.hitmarkerDefaultLocation" :aria-label="t('settings.jobIntelligence.hitmarkerLocationLabel')" type="text" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.greenhouseApiLabel") }}</legend>
            <input v-model="jobProviderForm.greenhouseApiBaseUrl" :aria-label="t('settings.jobIntelligence.greenhouseApiLabel')" type="url" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.greenhouseMaxPagesLabel") }}</legend>
            <input v-model.number="jobProviderForm.greenhouseMaxPages" :aria-label="t('settings.jobIntelligence.greenhouseMaxPagesLabel')" type="number" min="1" max="20" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.leverApiLabel") }}</legend>
            <input v-model="jobProviderForm.leverApiBaseUrl" :aria-label="t('settings.jobIntelligence.leverApiLabel')" type="url" class="input w-full" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("settings.jobIntelligence.leverMaxPagesLabel") }}</legend>
            <input v-model.number="jobProviderForm.leverMaxPages" :aria-label="t('settings.jobIntelligence.leverMaxPagesLabel')" type="number" min="1" max="20" class="input w-full" />
          </fieldset>
        </SectionGrid>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.greenhouseBoardsLabel") }}</legend>
          <textarea v-model="jobProviderForm.greenhouseBoardsJson" :aria-label="t('settings.jobIntelligence.greenhouseBoardsLabel')" class="textarea min-h-32 w-full font-mono text-xs" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.leverCompaniesLabel") }}</legend>
          <textarea v-model="jobProviderForm.leverCompaniesJson" :aria-label="t('settings.jobIntelligence.leverCompaniesLabel')" class="textarea min-h-32 w-full font-mono text-xs" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.companyBoardsLabel") }}</legend>
          <textarea v-model="jobProviderForm.companyBoardsJson" :aria-label="t('settings.jobIntelligence.companyBoardsLabel')" class="textarea min-h-32 w-full font-mono text-xs" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.companyTemplatesLabel") }}</legend>
          <textarea v-model="jobProviderForm.companyBoardApiTemplatesJson" :aria-label="t('settings.jobIntelligence.companyTemplatesLabel')" class="textarea min-h-32 w-full font-mono text-xs" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.gamingPortalsLabel") }}</legend>
          <textarea v-model="jobProviderForm.gamingPortalsJson" :aria-label="t('settings.jobIntelligence.gamingPortalsLabel')" class="textarea min-h-32 w-full font-mono text-xs" />
        </fieldset>

        <div class="card-actions justify-end">
          <button class="btn btn-primary" @click="emit('saveProviders')">
            {{ providerSaveState === "saving" ? t("settings.jobIntelligence.savingProviders") : t("settings.jobIntelligence.saveProviders") }}
          </button>
        </div>
      </div>

      <div class="divider divider-primary">{{ t("settings.jobIntelligence.taxonomyTitle") }}</div>

      <div class="space-y-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.taxonomyKeywordsLabel") }}</legend>
          <textarea v-model="jobTaxonomyForm.keywordsJson" :aria-label="t('settings.jobIntelligence.taxonomyKeywordsLabel')" class="textarea min-h-48 w-full font-mono text-xs" />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("settings.jobIntelligence.taxonomyStudiosLabel") }}</legend>
          <textarea v-model="jobTaxonomyForm.studioRulesJson" :aria-label="t('settings.jobIntelligence.taxonomyStudiosLabel')" class="textarea min-h-40 w-full font-mono text-xs" />
        </fieldset>
        <div class="card-actions justify-end">
          <button class="btn btn-secondary" @click="emit('saveTaxonomy')">
            {{ taxonomySaveState === "saving" ? t("settings.jobIntelligence.savingTaxonomy") : t("settings.jobIntelligence.saveTaxonomy") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
