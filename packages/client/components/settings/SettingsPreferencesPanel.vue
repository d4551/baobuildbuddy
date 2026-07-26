<script setup lang="ts">
import type { NotificationPreferences } from "@bao/shared/types/settings-contracts";
import { useI18n } from "vue-i18n";
import {
  CHECKBOX_CONTROL_CLASS,
  CONTROL_TARGET_ROW_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOGGLE_CONTROL_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import type { SaveState } from "./save-state";

const preferencesLanguage = defineModel<string>("preferencesLanguage", { required: true });

const notificationForm = defineModel<NotificationPreferences>("notificationForm", {
  required: true,
});

defineProps<{
  theme: string;
  themeNames: { light: string; dark: string };
  languageOptions: ReadonlyArray<{ value: string; label: string }>;
  preferencesSaveState: SaveState;
}>();

const emit = defineEmits<{
  save: [];
  toggleTheme: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <!-- Title owned by WorkspaceSectionNavigator; header kept for SSOT contract. -->
      <SettingsPanelHeader />
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <div class="flex items-center justify-between">
          <span>{{ t("settings.preferences.themeLabel") }}</span>
          <label :class="[CONTROL_TARGET_ROW_CLASS]">
            <span :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{
              t("settings.preferences.lightTheme")
            }}</span>
            <input 
              type="checkbox"
              :class="[TOGGLE_CONTROL_CLASS, 'theme-controller']"
              :value="themeNames.dark"
              :checked="theme === themeNames.dark"
              :aria-label="t('settings.preferences.toggleThemeAria')"
              @change="emit('toggleTheme')"
            />
            <span :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{
              t("settings.preferences.darkTheme")
            }}</span>
          </label>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.preferences.languageLegend") }}
          </legend>
          <select 
            v-model="preferencesLanguage"
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('settings.preferences.languageAria')"
          >
            <option
              v-for="option in languageOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.preferences.notificationsLegend") }}
          </legend>
          <label class="justify-start" :class="[CONTROL_TARGET_ROW_CLASS]">
            <input 
              v-model="notificationForm.achievements"
              type="checkbox"
              :class="[CHECKBOX_CONTROL_CLASS]"
              :aria-label="
                t('settings.preferences.notifications.achievementsAria')
              "
            />
            <span>{{
              t("settings.preferences.notifications.achievements")
            }}</span>
          </label>
          <label class="justify-start" :class="[CONTROL_TARGET_ROW_CLASS]">
            <input 
              v-model="notificationForm.dailyChallenges"
              type="checkbox"
              :class="[CHECKBOX_CONTROL_CLASS]"
              :aria-label="
                t(
                  'settings.preferences.notifications.dailyChallengesAria',
                )
              "
            />
            <span>{{
              t("settings.preferences.notifications.dailyChallenges")
            }}</span>
          </label>
          <label class="justify-start" :class="[CONTROL_TARGET_ROW_CLASS]">
            <input 
              v-model="notificationForm.levelUp"
              type="checkbox"
              :class="[CHECKBOX_CONTROL_CLASS]"
              :aria-label="
                t('settings.preferences.notifications.levelUpAria')
              "
            />
            <span>{{
              t("settings.preferences.notifications.levelUp")
            }}</span>
          </label>
          <label class="justify-start" :class="[CONTROL_TARGET_ROW_CLASS]">
            <input 
              v-model="notificationForm.jobAlerts"
              type="checkbox"
              :class="[CHECKBOX_CONTROL_CLASS]"
              :aria-label="
                t('settings.preferences.notifications.jobAlertsAria')
              "
            />
            <span>{{
              t("settings.preferences.notifications.jobAlerts")
            }}</span>
          </label>
        </fieldset>
      </div>

      <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt2]">
        <button type="button" 
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('settings.preferences.saveAria')"
          :disabled="preferencesSaveState === 'saving'"
          @click="emit('save')"
        >
          <LoadingSpinner
            v-if="preferencesSaveState === 'saving'"
            size="xs"
            :label="t('settings.preferences.saveButton')"
          />
          {{ t("settings.preferences.saveButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
