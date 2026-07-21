<script setup lang="ts">
import type { GamingPortalConfig } from "@bao/shared/types/settings";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";
import {
  countConfiguredGamingPortals,
  parseGamingPortalsJson,
  serializeGamingPortalsJson,
  setGamingPortalEnabled,
} from "~/utils/gaming-portals-form";
import type { JobProviderForm } from "./job-intelligence";

const jobProviderForm = defineModel<JobProviderForm>("jobProviderForm", { required: true });

const { t } = useI18n();

const portals = computed(() => parseGamingPortalsJson(jobProviderForm.value.gamingPortalsJson));

const configuredPortalCount = computed(() => countConfiguredGamingPortals(portals.value));

const parseFailed = computed(() => {
  const raw = jobProviderForm.value.gamingPortalsJson.trim();
  if (raw.length === 0) {
    return false;
  }
  return portals.value.length === 0;
});

function onToggle(portal: GamingPortalConfig, enabled: boolean): void {
  const next = setGamingPortalEnabled(portals.value, portal.id, enabled);
  jobProviderForm.value.gamingPortalsJson = serializeGamingPortalsJson(next);
  if (portal.id === "hitmarker") {
    jobProviderForm.value.hitmarkerEnabled = enabled;
  }
}
</script>

<template>
  <UiGlassCard :aria-label="t('settings.jobIntelligence.gamingPortalsTogglesTitle')">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
          <h3 class="card-title text-base">
            {{ t("settings.jobIntelligence.gamingPortalsTogglesTitle") }}
          </h3>
          <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.jobIntelligence.gamingPortalsTogglesDescription") }}
          </p>
        </div>
        <span
          class="shrink-0"
          :class="[configuredPortalCount > 0 ? BADGE_SUCCESS_SM_CLASS : BADGE_GHOST_SM_CLASS]"
        >
          {{
            t("settings.jobIntelligence.gamingPortalsConfiguredCount", {
              count: configuredPortalCount,
            })
          }}
        </span>
      </div>

      <div
        v-if="parseFailed"
        role="alert"
        class="alert alert-warning"
        :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
      >
        {{ t("settings.jobIntelligence.gamingPortalsParseError") }}
      </div>

      <ul
        v-else
        class="list"
        :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]"
        :aria-label="t('settings.jobIntelligence.gamingPortalsTogglesTitle')"
      >
        <li
          v-for="portal in portals"
          :key="portal.id"
          class="list-row items-center rounded-box border border-base-300 bg-base-100"
          :class="[PADDING_TOKEN_CLASS.px4, PADDING_TOKEN_CLASS.py3]"
        >
          <div class="list-col-grow" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]">
            <span class="font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ portal.name }}</span>
            <span class="text-muted truncate" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ portal.fallbackUrl || t("settings.jobIntelligence.gamingPortalsMissingUrl") }}
            </span>
          </div>
          <input
            :key="`${portal.id}-${portal.enabled ? 'on' : 'off'}`"
            class="toggle toggle-primary"
            type="checkbox"
            :checked="portal.enabled"
            :aria-label="
              t('settings.jobIntelligence.gamingPortalToggleAria', { name: portal.name })
            "
            :disabled="portal.fallbackUrl.trim().length === 0"
            @click.prevent="onToggle(portal, !portal.enabled)"
          />
        </li>
      </ul>
    </div>
  </UiGlassCard>
</template>
