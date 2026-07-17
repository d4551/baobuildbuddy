<script setup lang="ts">
import { useI18n } from "vue-i18n";
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
  <div class="space-y-5">
    <h2 class="text-lg font-semibold">{{ t("setup.aiConfigTitle") }}</h2>
    <div role="alert" class="alert alert-info alert-soft">
      <span>{{ t("setup.localFirstInfo", { brand: brandName }) }}</span>
    </div>

    <div
      role="alert"
      class="alert alert-info alert-soft alert-vertical items-start sm:alert-horizontal"
    >
      <IconInfoCircle class="mt-1 h-6 w-6 shrink-0 stroke-current text-info" />
      <div class="w-full flex-1 overflow-hidden">
        <h3 class="mb-1 font-semibold">
          {{ t("settings.aiProviders.ollamaTipTitle") }}
        </h3>
        <p class="mb-3 text-sm">
          {{ t("settings.aiProviders.ollamaTipDescription") }}
          <NuxtLink
            :to="ollamaWebsiteUrl"
            target="_blank"
            class="link link-primary inline-flex items-center gap-1"
            :aria-label="t('settings.aiProviders.ollamaTipLinkAria')"
          >
            {{ t("settings.aiProviders.ollamaTipLinkLabel") }}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-3 w-3 shrink-0"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </NuxtLink>
        </p>

        <div class="group relative mt-2 w-full overflow-hidden rounded-box border border-base-200 bg-base-300 text-base-content">
          <div class="overflow-x-auto whitespace-nowrap p-3 pr-14 text-sm font-mono">
            <span class="mr-2 text-muted">$</span>{{ ollamaCommand }}
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
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <label class="floating-label w-full">
      <span>{{ t("setup.localEndpointLegend") }}</span>
      <input
        :value="localModelEndpoint"
        type="text"
        class="input w-full"
        :aria-label="t('setup.localEndpointAria')"
        @input="updateInputValue($event, 'update:local-model-endpoint')"
      />
    </label>
    <div class="label">{{ t("setup.localEndpointExamples") }}</div>

    <label class="floating-label w-full">
      <span>{{ t("setup.localModelLegend") }}</span>
      <input
        :value="localModelName"
        type="text"
        class="input w-full"
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
      <span
        v-if="testing && testingProvider === 'local'"
        class="loading loading-spinner loading-xs"
      ></span>
      {{ t("setup.testLocalButton") }}
    </button>

    <details class="collapse collapse-arrow bg-base-200">
      <summary class="collapse-title font-medium">
        {{ t("setup.cloudOptionalTitle") }}
      </summary>
      <div class="collapse-content space-y-4">
        <fieldset
          v-for="provider in cloudProviderIds"
          :key="provider"
          class="fieldset"
        >
          <legend class="fieldset-legend">
            {{ t("setup.cloudProviderLegend", { provider: providerLabels[provider] }) }}
          </legend>
          <div class="join w-full">
            <input
              :value="providerCredentials[provider]"
              type="password"
              :placeholder="t('setup.cloudProviderPlaceholder', { provider: providerLabels[provider] })"
              class="input join-item w-full"
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
