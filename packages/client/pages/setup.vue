<script setup lang="ts">
import {  FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import {  FLUID_WIDTH_CLASS, useI18n } from "vue-i18n";
import {  FLUID_WIDTH_CLASS, getErrorMessage } from "~/utils/errors";

definePageMeta({
  layout: "auth-shell",
});

const {
  resolvedBrand,
  OLLAMA_WEBSITE_URL,
  step,
  name,
  currentRole,
  authSetupToken,
  existingApiKey,
  localModelEndpoint,
  localModelName,
  providerCredentials,
  providerLabels,
  cloudProviderIds,
  testing,
  saving,
  testingProvider,
  setupBootstrapError,
  setupBootstrapPending,
  refreshSetupBootstrap,
  authBootstrapRequired,
  authSetupTokenConfigured,
  needsStoredApiKey,
  ollamaCommand,
  handleTestProvider,
  handleComplete,
  copyOllamaCommand,
  updateProviderCredential,
} = useSetupPage();

const { t } = useI18n();

useSeoMeta({
  title: t("setup.seoTitle", { brand: resolvedBrand.name }),
  description: t("setup.seoDescription"),
});
</script>

<template>
  <PageScaffold
    tag="section"
    width-token="shell"
    spacing-token="compact"
    labelled-by="setup-title"
    :extra-class="FLUID_WIDTH_CLASS"
  >
    <h1 id="setup-title" class="text-primary" :class="[MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.xl2, 'font-bold']">
      {{ t("setup.title", { brand: resolvedBrand.name }) }}
    </h1>

    <LoadingSkeleton v-if="setupBootstrapPending" :lines="8" />

    <BootstrapErrorAlert
      v-else-if="setupBootstrapError"
      :message="getErrorMessage(setupBootstrapError, t('setup.bootstrapError'))"
      :retry-label="t('setup.bootstrapRetry')"
      :retry-aria-label="t('setup.bootstrapRetryAria')"
      @retry="() => refreshSetupBootstrap()"
    />

    <template v-else>
      <SetupStepIndicator :current-step="step" />

      <SetupProfileStep
        v-if="step === 1"
        :name="name"
        :current-role="currentRole"
        @update:name="name = $event"
        @update:current-role="currentRole = $event"
        @next="step = 2"
      />

      <SetupAiConfigStep
        v-else-if="step === 2"
        :brand-name="resolvedBrand.name"
        :local-model-endpoint="localModelEndpoint"
        :local-model-name="localModelName"
        :ollama-command="ollamaCommand"
        :cloud-provider-ids="cloudProviderIds"
        :provider-labels="providerLabels"
        :provider-credentials="providerCredentials"
        :testing="testing"
        :testing-provider="testingProvider"
        :ollama-website-url="OLLAMA_WEBSITE_URL"
        @update:local-model-endpoint="localModelEndpoint = $event"
        @update:local-model-name="localModelName = $event"
        @update:provider-credential="updateProviderCredential($event.provider, $event.value)"
        @test-provider="handleTestProvider"
        @copy="copyOllamaCommand"
        @back="step = 1"
        @next="step = 3"
      />

      <SetupCompletionStep
        v-else
        :brand-name="resolvedBrand.name"
        :assistant-name="resolvedBrand.assistantName"
        :auth-bootstrap-required="authBootstrapRequired"
        :auth-setup-token-configured="authSetupTokenConfigured"
        :needs-stored-api-key="needsStoredApiKey"
        :auth-setup-token="authSetupToken"
        :existing-api-key="existingApiKey"
        :saving="saving"
        @update:auth-setup-token="authSetupToken = $event"
        @update:existing-api-key="existingApiKey = $event"
        @back="step = 2"
        @complete="handleComplete"
      />
    </template>
  </PageScaffold>
</template>
