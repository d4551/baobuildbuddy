<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SVG_SIZE_13,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { CloudProvider, SetupProvider } from "./setup-page-contracts";

defineProps<{
  brandName: string;
  localModelEndpoint: string;
  localModelName: string;
  ollamaCommand: string;
  cloudProviderIds: readonly CloudProvider[];
  providerLabels: Record<SetupProvider, string>;
  providerCredentials: Record<CloudProvider, string>;
  testing: boolean;
  testingProvider: SetupProvider | null;
  ollamaWebsiteUrl: string;
}>();

const emit = defineEmits<{
  "update:local-model-endpoint": [value: string];
  "update:local-model-name": [value: string];
  "update:provider-credential": [payload: { provider: CloudProvider; value: string }];
  "test-provider": [provider: SetupProvider];
  copy: [];
  back: [];
  next: [];
}>();

const { t } = useI18n();

function updateInputValue(
  event: Event,
  emitEvent: "update:local-model-endpoint" | "update:local-model-name",
): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit(emitEvent, target.value);
  }
}

function updateProviderCredential(event: Event, provider: CloudProvider): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:provider-credential", { provider, value: target.value });
  }
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack5]">
    <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("setup.aiConfigTitle") }}</h2>
    <div role="alert" class="alert alert-info alert-soft">
      <span>{{ t("setup.localFirstInfo", { brand: brandName }) }}</span>
    </div>

    <div
      role="alert"
      class="alert alert-info alert-soft alert-vertical items-start sm:alert-horizontal"
    >
 <IconInfoCircle class="shrink-0 stroke-current text-info" / :class="[ICON_SIZE_CLASS['6'], MARGIN_TOKEN_CLASS.mt1]">
      <div class="flex-1 overflow-hidden" :class="[FLUID_WIDTH_CLASS]">
        <h3 class="font-semibold" :class="[MARGIN_TOKEN_CLASS.mb1]">
          {{ t("settings.aiProviders.ollamaTipTitle") }}
        </h3>
 <p :class="[MARGIN_TOKEN_CLASS.mb3, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ t("settings.aiProviders.ollamaTipDescription") }}
          <NuxtLink
            :to="ollamaWebsiteUrl"
            target="_blank"
            class="link link-primary inline-flex items-center"
            :class="[FLEX_GAP_TOKEN_CLASS.gap1, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.aiProviders.ollamaTipLinkAria')"
          >
            {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0" :class="[ICON_SIZE_CLASS['3']]"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </NuxtLink>
        </p>

        <div class="group relative overflow-hidden rounded-box border border-base-200 bg-base-300 text-base-content" :class="[FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS.mt2]">
 <div class="overflow-x-auto whitespace-nowrap font-mono" :class="[PADDING_TOKEN_CLASS.pr14, PADDING_TOKEN_CLASS.p3, TYPOGRAPHY_SCALE_CLASS.sm]">
            <span class="text-muted" :class="[MARGIN_TOKEN_CLASS.mr2]">$</span>{{ ollamaCommand }}
          </div>
          <button
            class="glass-subtle btn btn-square btn-sm btn-ghost absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors"
            type="button"
            :aria-label="t('setup.ollamaCommandCopyAria')"
            :title="t('setup.ollamaCommandCopyTitle')"
            @click="emit('copy')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0" :class="[ICON_SIZE_CLASS['4']]"
              aria-hidden="true"
            >
              <rect x="9" y="9" :width="SVG_SIZE_13" :height="SVG_SIZE_13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.localEndpointLegend") }}</span>
      <input
        :value="localModelEndpoint"
        type="text"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.localEndpointAria')"
        @input="updateInputValue($event, 'update:local-model-endpoint')"
      />
    </label>
    <div class="label">{{ t("setup.localEndpointExamples") }}</div>

    <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.localModelLegend") }}</span>
      <input
        :value="localModelName"
        type="text"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.localModelAria')"
        @input="updateInputValue($event, 'update:local-model-name')"
      />
    </label>

    <button
      class="btn btn-outline btn-sm"
      :disabled="testing && testingProvider === 'local'"
      :aria-label="t('setup.testLocalAria')"
      @click="emit('test-provider', 'local')"
    >
      <LoadingSpinner size="xs" label="Loading" v-if="testing && testingProvider === 'local'" />
      {{ t("setup.testLocalButton") }}
    </button>

    <details class="collapse collapse-arrow bg-base-200">
      <summary class="collapse-title font-medium">
        {{ t("setup.cloudOptionalTitle") }}
      </summary>
      <div class="collapse-content" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset
          v-for="provider in cloudProviderIds"
          :key="provider"
          class="fieldset"
        >
          <legend class="fieldset-legend">
            {{ t("setup.cloudProviderLegend", { provider: providerLabels[provider] }) }}
          </legend>
          <div class="join" :class="[FLUID_WIDTH_CLASS]">
            <input
              :value="providerCredentials[provider]"
              type="password"
              :placeholder="t('setup.cloudProviderPlaceholder', { provider: providerLabels[provider] })"
              class="input join-item" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('setup.cloudProviderAria', { provider: providerLabels[provider] })"
              @input="updateProviderCredential($event, provider)"
            />
            <button
              class="btn btn-outline join-item"
              :disabled="testing || !providerCredentials[provider].trim()"
              :aria-label="t('setup.testProviderAria', { provider: providerLabels[provider] })"
              @click="emit('test-provider', provider)"
            >
              {{ t("setup.testButton") }}
            </button>
          </div>
        </fieldset>
      </div>
    </details>

    <div class="flex justify-between">
      <button class="btn btn-ghost" :aria-label="t('setup.backToProfileAria')" @click="emit('back')">
        {{ t("setup.backButton") }}
      </button>
      <button class="btn btn-primary" :aria-label="t('setup.nextToDoneAria')" @click="emit('next')">
        {{ t("setup.nextButton") }}
      </button>
    </div>
  </div>
</template>
