<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { STACK_SPACE_Y_TOKEN_CLASS, TOUCH_TARGET_MIN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useAIDashboardPage } from "~/composables/useAIDashboardPage";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();

useSeoMeta({
  title: t("aiDashboard.title"),
  description: t("aiDashboard.subtitle"),
});

const page = reactive(useAIDashboardPage());
</script>

<template>
  <PageScaffold tag="section" labelled-by="ai-dashboard-title">
    <PageHeroHeader
      title-id="ai-dashboard-title"
      :title="t('aiDashboard.title')"
      :description="t('aiDashboard.subtitle')"
    >
      <template #actions>
        <button
          class="btn btn-outline"
          :class="[TOUCH_TARGET_MIN_CLASS]"
          :disabled="page.loading"
          :aria-label="t('aiDashboard.preference.refreshAria')"
          @click="page.fetchProviderStats"
        >
          <LoadingSpinner size="sm" :label="t('aiDashboard.preference.refreshButton')" v-if="page.loading" />
          <span>{{ t("aiDashboard.preference.refreshButton") }}</span>
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="page.loading" :lines="8" />
    <BootstrapErrorAlert
      v-else-if="page.dashboardBootstrapError"
      :message="getErrorMessage(page.dashboardBootstrapError, t('aiDashboard.toasts.loadFailed'))"
      :retry-label="t('aiDashboard.preference.refreshButton')"
      :retry-aria-label="t('aiDashboard.preference.refreshAria')"
      @retry="page.fetchProviderStats"
    />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <StatsRow v-if="page.providerStats" :stats="page.statsItems" />

      <ClientOnly>
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
        <template #fallback>
          <LoadingSkeleton :lines="5" />
        </template>
      </ClientOnly>

      <EmptyState
        v-if="page.providers.length === 0"
        title-key="aiDashboard.alerts.noProvidersTitle"
        description-key="aiDashboard.alerts.noProvidersDescription"
        cta-label-key="aiDashboard.alerts.configureProvidersCta"
        cta-aria-key="aiDashboard.alerts.configureProvidersAria"
        :cta-to="APP_ROUTE_BUILDERS.settingsSection('aiProviders')"
      />

      <AIDashboardProviderGrid
        v-else
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
