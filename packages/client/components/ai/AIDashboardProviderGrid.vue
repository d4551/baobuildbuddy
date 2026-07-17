<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import type { AIProviderType } from "@bao/shared/types/ai";
import type {
  ProviderConfig,
  ProviderConnectivityResult,
  ProviderHealth,
} from "~/types/ai-dashboard";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const props = defineProps<{
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

function resolveProviderStatus(provider: ProviderConfig): {
  label: string;
  badgeClass: string;
} {
  const configured = props.isProviderConfigured(provider.id);
  if (!configured) {
    return {
      label: props.t("aiDashboard.providerCard.notConfiguredBadge"),
      badgeClass: "badge-warning badge-soft",
    };
  }
  if (!provider.available) {
    return {
      label: props.providerAvailabilityLabel(false),
      badgeClass: "badge-neutral badge-soft",
    };
  }
  return {
    label: props.providerHealthLabel(provider.health),
    badgeClass: props.providerHealthBadgeClass(provider.health),
  };
}
</script>

<template>
  <SectionGrid grid-token="twoColumnMdGap6">
    <div
      v-for="provider in providers"
      :key="provider.id"
      class="card card-border card-glass card-glass-interactive"
    >
      <div class="card-body gap-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <AIProviderIcon
              :provider-id="provider.iconId"
              class="h-8 w-8 shrink-0 text-primary"
            />
            <div class="min-w-0">
              <h3 class="card-title text-lg">{{ providerLabel(provider.id) }}</h3>
              <p class="text-xs text-secondary">{{ providerDescription(provider.id) }}</p>
            </div>
          </div>
          <span class="badge badge-sm shrink-0" :class="resolveProviderStatus(provider).badgeClass">
            {{ resolveProviderStatus(provider).label }}
          </span>
        </div>

        <div
          v-if="testResults[provider.id]"
          role="status"
          class="alert alert-soft"
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
            :disabled="testingProvider === provider.id || !isProviderConfigured(provider.id)"
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
            :to="APP_ROUTE_BUILDERS.settingsSection('aiProviders')"
            class="btn btn-primary btn-sm"
            :aria-label="t('aiDashboard.providerCard.configureAria', { provider: providerLabel(provider.id) })"
          >
            {{ t("aiDashboard.providerCard.configureButton") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </SectionGrid>
</template>
