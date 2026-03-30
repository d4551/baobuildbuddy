<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  getSaveStateBadgeClass,
  getSaveStateLabelKey,
  type SaveState,
} from "./save-state";

const props = defineProps<{
  profileSaveState: SaveState;
}>();

const profileForm = defineModel<{
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  currentRole: string;
  currentCompany: string;
  yearsExperience: number;
  technicalSkillsText: string;
  softSkillsText: string;
}>("profileForm", { required: true });

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();
const profileSaveStateLabel = computed(() => {
  const key = getSaveStateLabelKey(props.profileSaveState);
  return key ? t(key) : "";
});
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body">
      <div class="flex items-center justify-between gap-3">
        <h2 class="card-title">{{ t("settings.profile.title") }}</h2>
        <span
          class="badge"
          :class="getSaveStateBadgeClass(profileSaveState)"
        >
          {{ profileSaveStateLabel }}
        </span>
      </div>

      <SectionGrid grid-token="twoColumn">
        <label class="floating-label w-full">
          <span>{{ t("settings.profile.nameLegend") }}</span>
          <input
            v-model="profileForm.name"
            required
            minlength="2"
            class="input validator w-full"
            :aria-label="t('settings.profile.nameAria')"
          />
          <p class="validator-hint">{{ t("settings.profile.nameHint") }}</p>
        </label>

        <label class="floating-label w-full">
          <span>{{ t("settings.profile.emailLegend") }}</span>
          <input
            v-model="profileForm.email"
            type="email"
            required
            class="input validator w-full"
            :aria-label="t('settings.profile.emailAria')"
          />
          <p class="validator-hint">
            {{ t("settings.profile.emailHint") }}
          </p>
        </label>

        <label class="floating-label w-full">
          <span>{{ t("settings.profile.currentRoleLegend") }}</span>
          <input
            v-model="profileForm.currentRole"
            class="input w-full"
            :aria-label="t('settings.profile.currentRoleAria')"
          />
        </label>

        <label class="floating-label w-full">
          <span>{{ t("settings.profile.currentCompanyLegend") }}</span>
          <input
            v-model="profileForm.currentCompany"
            class="input w-full"
            :aria-label="t('settings.profile.currentCompanyAria')"
          />
        </label>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.locationLegend") }}
          </legend>
          <input
            v-model="profileForm.location"
            class="input w-full"
            :aria-label="t('settings.profile.locationAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.yearsExperienceLegend") }}
          </legend>
          <input
            v-model.number="profileForm.yearsExperience"
            type="number"
            min="0"
            max="80"
            class="input w-full"
            :aria-label="t('settings.profile.yearsExperienceAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.githubLegend") }}
          </legend>
          <input
            v-model="profileForm.github"
            class="input w-full"
            :aria-label="t('settings.profile.githubAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.linkedinLegend") }}
          </legend>
          <input
            v-model="profileForm.linkedin"
            class="input w-full"
            :aria-label="t('settings.profile.linkedinAria')"
          />
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">
            {{ t("settings.profile.summaryLegend") }}
          </legend>
          <textarea
            v-model="profileForm.summary"
            class="textarea w-full"
            rows="4"
            :aria-label="t('settings.profile.summaryAria')"
          ></textarea>
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">
            {{ t("settings.profile.technicalSkillsLegend") }}
          </legend>
          <input
            v-model="profileForm.technicalSkillsText"
            class="input w-full"
            :placeholder="t('settings.profile.technicalSkillsPlaceholder')"
            :aria-label="t('settings.profile.technicalSkillsAria')"
          />
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">
            {{ t("settings.profile.softSkillsLegend") }}
          </legend>
          <input
            v-model="profileForm.softSkillsText"
            class="input w-full"
            :placeholder="t('settings.profile.softSkillsPlaceholder')"
            :aria-label="t('settings.profile.softSkillsAria')"
          />
        </fieldset>
      </SectionGrid>

      <div class="card-actions justify-end">
        <button
          class="btn btn-primary"
          :aria-label="t('settings.profile.saveAria')"
          :disabled="profileSaveState === 'saving'"
          @click="emit('save')"
        >
          <span
            v-if="profileSaveState === 'saving'"
            class="loading loading-spinner loading-xs"
          ></span>
          {{ t("settings.profile.saveButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
