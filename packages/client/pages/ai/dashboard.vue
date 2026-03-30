<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAIDashboardPage } from "~/composables/useAIDashboardPage";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("aiDashboard.title"),
    description: t("aiDashboard.subtitle"),
  });
}

const page = await useAIDashboardPage();
</script>

<template>
  <PageScaffold tag="section" labelled-by="ai-dashboard-title">
    <PageHeroHeader
      title-id="ai-dashboard-title"
      :title="t('aiDashboard.title')"
      :description="t('aiDashboard.subtitle')"
      description-class="text-base-content/70"
    >
      <template #actions>
        <button
          class="btn btn-outline btn-sm"
          :disabled="page.loading"
          :aria-label="t('aiDashboard.preference.refreshAria')"
          @click="page.fetchProviderStats"
        >
          <span v-if="page.loading" class="loading loading-spinner loading-xs"></span>
          <span>{{ t("aiDashboard.preference.refreshButton") }}</span>
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="page.loading && !page.providerStats" :lines="8" />
    <BootstrapErrorAlert
      v-else-if="page.dashboardBootstrapError"
      :message="getErrorMessage(page.dashboardBootstrapError, t('aiDashboard.toasts.loadFailed'))"
      :retry-label="t('aiDashboard.preference.refreshButton')"
      :retry-aria-label="t('aiDashboard.preference.refreshAria')"
      @retry="page.fetchProviderStats"
    />

    <div v-else class="space-y-6">
      <StatsRow v-if="page.providerStats" :stats="page.statsItems" />

      <AIDashboardPreferenceCard
        v-model:selected-provider="page.selectedProvider"
        v-model:selected-model="page.selectedModel"
        :loading="page.loading"
        :providers="page.providers"
        :selected-provider-models="page.selectedProviderModels"
        :is-provider-configured="page.isProviderConfigured"
        :provider-select-option-label="page.providerSelectOptionLabel"
        :on-save="page.handleSetPreference"
        :t="page.t"
      />

      <div
        v-if="page.providers.length === 0"
        role="alert"
        class="alert alert-warning alert-vertical sm:alert-horizontal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
        <div>
          <h3 class="font-bold">{{ t("aiDashboard.alerts.noProvidersTitle") }}</h3>
          <p class="text-xs">{{ t("aiDashboard.alerts.noProvidersDescription") }}</p>
        </div>
      </div>

      <AIDashboardProviderGrid
        :providers="page.providers"
        :testing-provider="page.testingProvider"
        :test-results="page.testResults"
        :is-provider-configured="page.isProviderConfigured"
        :provider-availability-label="page.providerAvailabilityLabel"
        :provider-description="page.providerDescription"
        :provider-health-badge-class="page.providerHealthBadgeClass"
        :provider-health-label="page.providerHealthLabel"
        :provider-label="page.providerLabel"
        :on-test-provider="page.handleTestProvider"
        :t="page.t"
      />
    </div>
  </PageScaffold>
</template>
