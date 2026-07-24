<script setup lang="ts">
import type { EmailTransportSettings } from "@bao/shared/types/settings-contracts";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";
import {
  SECONDARY_ACTION_CLASS,
} from "~/constants/layout-action-soft";
import {
  BADGE_VARIANT_CLASS,
} from "~/constants/layout-badges";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";

const emailTransportForm = defineModel<EmailTransportSettings>("emailTransportForm", {
  required: true,
});
const emailTransportPasswordDraft = defineModel<string>("emailTransportPasswordDraft", {
  required: true,
});

defineProps<{
  emailDeliveryConfigured: boolean;
  hasStoredPassword: boolean;
  resolvedBrandName: string;
  securityOptionLabels: ReadonlyArray<{ value: string; label: string }>;
  authModeOptionLabels: ReadonlyArray<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  saveSettings: [];
  savePassword: [];
  clearPassword: [];
}>();

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <SettingsPanelHeader>
        <template #meta>
          <span 
            class="badge"
            :class="emailDeliveryConfigured ? BADGE_VARIANT_CLASS.success : BADGE_VARIANT_CLASS.warning"
          >
            {{
              emailDeliveryConfigured
                ? t("settings.emailDelivery.configuredBadge")
                : t("settings.emailDelivery.incompleteBadge")
            }}
          </span>
        </template>
      </SettingsPanelHeader>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.emailDelivery.hostLegend") }}
          </legend>
          <input 
            v-model="emailTransportForm.host"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            type="text"
            :placeholder="t('settings.emailDelivery.hostPlaceholder')"
            :aria-label="t('settings.emailDelivery.hostAria')"
          />
        </fieldset>

        <SectionGrid grid-token="twoColumn">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.portLegend") }}
            </legend>
            <input 
              v-model.number="emailTransportForm.port"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="number"
              min="1"
              max="65535"
              :aria-label="t('settings.emailDelivery.portAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.timeoutLegend") }}
            </legend>
            <input 
              v-model.number="emailTransportForm.connectionTimeoutSeconds"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="number"
              min="1"
              max="120"
              :aria-label="t('settings.emailDelivery.timeoutAria')"
            />
          </fieldset>
        </SectionGrid>

        <SectionGrid grid-token="twoColumn">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.securityLegend") }}
            </legend>
            <select 
              v-model="emailTransportForm.security"
              class="select" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('settings.emailDelivery.securityAria')"
            >
              <option
                v-for="option in securityOptionLabels"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.authLegend") }}
            </legend>
            <select 
              v-model="emailTransportForm.authMethod"
              class="select" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('settings.emailDelivery.authAria')"
            >
              <option
                v-for="option in authModeOptionLabels"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>
        </SectionGrid>

        <SectionGrid grid-token="twoColumn">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.usernameLegend") }}
            </legend>
            <input 
              v-model="emailTransportForm.username"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="text"
              :placeholder="
                t('settings.emailDelivery.usernamePlaceholder')
              "
              :aria-label="t('settings.emailDelivery.usernameAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              {{ t("settings.emailDelivery.fromNameLegend") }}
            </legend>
            <input 
              v-model="emailTransportForm.fromName"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              type="text"
              :placeholder="
                t('settings.emailDelivery.fromNamePlaceholder', {
                  brand: resolvedBrandName,
                })
              "
              :aria-label="t('settings.emailDelivery.fromNameAria')"
            />
          </fieldset>
        </SectionGrid>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.emailDelivery.fromEmailLegend") }}
          </legend>
          <input 
            v-model="emailTransportForm.fromEmail"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            type="email"
            :placeholder="
              t('settings.emailDelivery.fromEmailPlaceholder')
            "
            :aria-label="t('settings.emailDelivery.fromEmailAria')"
          />
          <p class="label">
            {{ t("settings.emailDelivery.fromEmailHint") }}
          </p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            {{ t("settings.emailDelivery.passwordLegend") }}
          </legend>
          <input 
            v-model="emailTransportPasswordDraft"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            type="password"
            :placeholder="t('settings.emailDelivery.passwordPlaceholder')"
            :aria-label="t('settings.emailDelivery.passwordAria')"
          />
          <p class="label">
            {{
              hasStoredPassword
                ? t("settings.emailDelivery.passwordStoredHint")
                : t("settings.emailDelivery.passwordHint")
            }}
          </p>
        </fieldset>
      </div>

      <div class="card-actions justify-end" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
        <button type="button" 
          :class="[OUTLINE_ACTION_CLASS]"
          :disabled="!hasStoredPassword"
          :aria-label="t('settings.emailDelivery.clearPasswordAria')"
          @click="emit('clearPassword')"
        >
          {{ t("settings.emailDelivery.clearPasswordButton") }}
        </button>
        <button type="button" 
          :class="[SECONDARY_ACTION_CLASS]"
          :aria-label="t('settings.emailDelivery.savePasswordAria')"
          @click="emit('savePassword')"
        >
          {{ t("settings.emailDelivery.savePasswordButton") }}
        </button>
        <button type="button" 
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('settings.emailDelivery.saveAria')"
          @click="emit('saveSettings')"
        >
          {{ t("settings.emailDelivery.saveButton") }}
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
