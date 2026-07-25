<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AppProseField from "~/components/ui/AppProseField.vue";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { FLUID_WIDTH_CLASS, SURFACE_GLASS_CARD_CLASS,
  PRIMARY_ACTION_CLASS,
} from "~/constants/layout";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import { getSaveStateBadgeClass, getSaveStateLabelKey, type SaveState } from "./save-state";

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
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <!-- Title owned by WorkspaceSectionNavigator — meta badge only. -->
      <SettingsPanelHeader>
        <template v-if="profileSaveStateLabel" #meta>
          <span
            class="badge"
            :class="getSaveStateBadgeClass(profileSaveState)"
            role="status"
            aria-live="polite"
          >
            {{ profileSaveStateLabel }}
          </span>
        </template>
      </SettingsPanelHeader>

      <SectionGrid grid-token="twoColumn">
        <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
          <span>{{ t("settings.profile.nameLegend") }}</span>
          <input 
            v-model="profileForm.name"
            required
            minlength="2"
            class="input validator" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.nameAria')"
          />
          <p class="validator-hint">{{ t("settings.profile.nameHint") }}</p>
        </label>

        <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
          <span>{{ t("settings.profile.emailLegend") }}</span>
          <input 
            v-model="profileForm.email"
            type="email"
            required
            class="input validator" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.emailAria')"
          />
          <p class="validator-hint">
            {{ t("settings.profile.emailHint") }}
          </p>
        </label>

        <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
          <span>{{ t("settings.profile.currentRoleLegend") }}</span>
          <input 
            v-model="profileForm.currentRole"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.currentRoleAria')"
          />
        </label>

        <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
          <span>{{ t("settings.profile.currentCompanyLegend") }}</span>
          <input 
            v-model="profileForm.currentCompany"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.currentCompanyAria')"
          />
        </label>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.locationLegend") }}
          </legend>
          <input 
            v-model="profileForm.location"
            class="input" :class="[FLUID_WIDTH_CLASS]"
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
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.yearsExperienceAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.githubLegend") }}
          </legend>
          <input 
            v-model="profileForm.github"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.githubAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.profile.linkedinLegend") }}
          </legend>
          <input 
            v-model="profileForm.linkedin"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.profile.linkedinAria')"
          />
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">
            {{ t("settings.profile.summaryLegend") }}
          </legend>
          <AppProseField
            v-model="profileForm.summary"
            :aria-label="t('settings.profile.summaryAria')"
          />
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">
            {{ t("settings.profile.technicalSkillsLegend") }}
          </legend>
          <input 
            v-model="profileForm.technicalSkillsText"
            class="input" :class="[FLUID_WIDTH_CLASS]"
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
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('settings.profile.softSkillsPlaceholder')"
            :aria-label="t('settings.profile.softSkillsAria')"
          />
        </fieldset>
      </SectionGrid>

      <div class="card-actions justify-end">
        <button 
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('settings.profile.saveAria')"
          :disabled="profileSaveState === 'saving'"
          @click="emit('save')"
        >
          <LoadingSpinner
            v-if="profileSaveState === 'saving'"
            size="xs"
            label="Saving"
          />
          {{ t("settings.profile.saveButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
