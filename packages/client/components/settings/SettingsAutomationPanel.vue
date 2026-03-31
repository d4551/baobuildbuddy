<script setup lang="ts">
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import { useI18n } from "vue-i18n";

defineProps<{
  automationBrowserOptions: ReadonlyArray<{ value: string; label: string }>;
}>();

const automationForm = defineModel<AutomationSettings>("automationForm", {
  required: true,
});

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">{{ t("settings.automation.title") }}</h2>
      <p class="text-sm text-base-content/70 mb-2">
        {{ t("settings.automation.subtitle") }}
      </p>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{
              t("settings.automation.headlessTitle")
            }}</span>
            <p class="text-sm text-base-content/60">
              {{ t("settings.automation.headlessDescription") }}
            </p>
          </div>
          <input
            v-model="automationForm.headless"
            type="checkbox"
            class="toggle toggle-primary"
            :aria-label="t('settings.automation.headlessAria')"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{
              t("settings.automation.smartSelectorsTitle")
            }}</span>
            <p class="text-sm text-base-content/60">
              {{ t("settings.automation.smartSelectorsDescription") }}
            </p>
          </div>
          <input
            v-model="automationForm.enableSmartSelectors"
            type="checkbox"
            class="toggle toggle-primary"
            :aria-label="t('settings.automation.smartSelectorsAria')"
          />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{
              t("settings.automation.autoScreenshotsTitle")
            }}</span>
            <p class="text-sm text-base-content/60">
              {{ t("settings.automation.autoScreenshotsDescription") }}
            </p>
          </div>
          <input
            v-model="automationForm.autoSaveScreenshots"
            type="checkbox"
            class="toggle toggle-primary"
            :aria-label="t('settings.automation.autoScreenshotsAria')"
          />
        </div>

        <SectionGrid>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.automation.timeoutLegend") }}
            </legend>
            <input
              v-model.number="automationForm.defaultTimeout"
              type="number"
              min="1"
              max="120"
              class="input w-full"
              :aria-label="t('settings.automation.timeoutAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.automation.retentionLegend") }}
            </legend>
            <input
              v-model.number="automationForm.screenshotRetention"
              type="number"
              min="1"
              max="30"
              class="input w-full"
              :aria-label="t('settings.automation.retentionAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.automation.concurrentRunsLegend") }}
            </legend>
            <input
              v-model.number="automationForm.maxConcurrentRuns"
              type="number"
              min="1"
              max="5"
              class="input w-full"
              :aria-label="t('settings.automation.concurrentRunsAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.automation.defaultBrowserLegend") }}
            </legend>
            <select
              v-model="automationForm.defaultBrowser"
              class="select w-full"
              :aria-label="t('settings.automation.defaultBrowserAria')"
            >
              <option
                v-for="browser in automationBrowserOptions"
                :key="browser.value"
                :value="browser.value"
              >
                {{ browser.label }}
              </option>
            </select>
          </fieldset>
        </SectionGrid>
      </div>

      <div class="card-actions justify-end mt-2">
        <button
          class="btn btn-primary"
          :aria-label="t('settings.automation.saveAria')"
          @click="emit('save')"
        >
          {{ t("settings.automation.saveButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
