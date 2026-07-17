<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { AIProviderType } from "@bao/shared/types/ai";
import type {
  ProviderConfig,
  ProviderConnectivityResult,
  ProviderHealth,
} from "~/types/ai-dashboard";

defineProps<{
  providers: readonly ProviderConfig[];
  testingProvider: AIProviderType | null;
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  isProviderConfigured: (providerId: AIProviderType) => boolean;
  providerAvailabilityLabel: (available: boolean) => string;
  providerDescription: (providerId: AIProviderType) => string;
  providerHealthBadgeClass: (health: ProviderHealth) => string;
  providerHealthLabel: (health: ProviderHealth) => string;
  providerLabel: (providerId: AIProviderType) => string;
  onTestProvider: (providerId: AIProviderType) => Promise<void> | void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    <div
      v-for="provider in providers"
      :key="provider.id"
      class="card-glass card-glass-interactive"
    >
      <div class="card-body gap-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <AIProviderIcon
              :provider-id="provider.iconId"
              class="h-8 w-8 shrink-0 text-primary"
            />
            <div class="min-w-0">
              <h3 class="card-title text-lg">{{ providerLabel(provider.id) }}</h3>
              <p class="text-xs text-base-content/70">{{ providerDescription(provider.id) }}</p>
            </div>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="isProviderConfigured(provider.id) ? 'badge-success' : 'badge-soft'"
          >
            {{
              isProviderConfigured(provider.id)
                ? t("aiDashboard.providerCard.configuredBadge")
                : t("aiDashboard.providerCard.notConfiguredBadge")
            }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="badge badge-sm"
            :class="provider.available ? 'badge-success badge-soft' : 'badge-neutral badge-soft'"
          >
            {{ providerAvailabilityLabel(provider.available) }}
          </span>
          <span class="badge badge-sm badge-outline" :class="providerHealthBadgeClass(provider.health)">
            {{ providerHealthLabel(provider.health) }}
          </span>
        </div>

        <div
          v-if="testResults[provider.id]"
          role="status"
          class="alert alert-vertical sm:alert-horizontal"
          :class="testResults[provider.id]?.valid ? 'alert-success' : 'alert-error'"
        >
          <div>
            <h4 class="font-semibold">
              {{
                testResults[provider.id]?.valid
                  ? t("aiDashboard.alerts.testSuccessTitle")
                  : t("aiDashboard.alerts.testErrorTitle")
              }}
            </h4>
            <p class="text-xs">{{ testResults[provider.id]?.message }}</p>
          </div>
        </div>

        <div class="card-actions justify-end">
          <button
            class="btn btn-outline btn-sm"
            :disabled="testingProvider === provider.id"
            :aria-label="t('aiDashboard.providerCard.testAria', { provider: providerLabel(provider.id) })"
            @click="onTestProvider(provider.id)"
          >
            <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
            <span>{{
              testingProvider === provider.id
                ? t("aiDashboard.providerCard.testingLabel")
                : t("aiDashboard.providerCard.testButton")
            }}</span>
          </button>
          <NuxtLink
            :to="APP_ROUTES.settings"
            class="btn btn-primary btn-sm"
            :aria-label="t('aiDashboard.providerCard.configureAria', { provider: providerLabel(provider.id) })"
          >
            {{ t("aiDashboard.providerCard.configureButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
