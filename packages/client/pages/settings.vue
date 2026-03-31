<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSeoMeta } from "#imports";
import { useSettingsPage } from "~/composables/useSettingsPage";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();

useSeoMeta({
  title: t("settings.seoTitle"),
  description: t("settings.seoDescription"),
});

const {
  settings,
  profile,
  resolvedBrand,
  theme,
  THEME_NAMES,
  settingsLoading,
  profileLoading,
  providerDiagnostics,
  providerInputs,
  languageOptions,
  automationBrowserOptionItems,
  securityOptionLabels,
  authModeOptionLabels,
  apiKeys,
  testResults,
  testingProvider,
  preferencesLanguage,
  preferredProviderSelection,
  preferencesSaveState,
  profileSaveState,
  brandSaveState,
  brandEditorPanel,
  notificationForm,
  automationForm,
  jobProviderForm,
  jobTaxonomyForm,
  jobProvidersSaveState,
  jobTaxonomySaveState,
  emailTransportForm,
  emailTransportPasswordDraft,
  aiRoutingDraft,
  brandForm,
  profileForm,
  settingsBootstrapError,
  settingsBootstrapStatus,
  refreshSettingsBootstrap,
  emailDeliveryConfigured,
  showOllamaHotTip,
  aiRoutingSections,
  routingModelOptions,
  providerConfiguredById,
  brandDraft,
  brandOverrideCount,
  handleTest,
  handleSavePreferredProvider,
  handleSaveRouting,
  handleSaveKeys,
  handleToggleTheme,
  handleSavePreferences,
  handleSaveProfile,
  handleSaveBrand,
  handleSaveAutomation,
  handleSaveJobProviders,
  handleSaveJobTaxonomy,
  handleSaveEmailDeliverySettings,
  handleSaveEmailDeliveryPassword,
  handleClearEmailDeliveryPassword,
} = useSettingsPage();
</script>

<template>
  <PageScaffold labelled-by="settings-page-title">
    <PageHeroHeader
      title-id="settings-page-title"
      :title="t('settings.title')"
      :description="t('settings.subtitle')"
      description-class="text-base-content/70 mt-2"
    />

    <BootstrapErrorAlert
      v-if="settingsBootstrapError"
      :message="getErrorMessage(settingsBootstrapError, t('settings.bootstrapError'))"
      :retry-label="t('settings.bootstrapRetry')"
      :retry-aria-label="t('settings.bootstrapRetryAria')"
      @retry="refreshSettingsBootstrap()"
    />

    <LoadingSkeleton
      v-else-if="
        settingsBootstrapStatus === 'pending' ||
          (settingsLoading && profileLoading && !settings && !profile)
      "
      :lines="8"
    />

    <div v-else class="space-y-6">
      <SettingsProfilePanel
        v-model:profile-form="profileForm"
        :profile-save-state="profileSaveState"
        @save="handleSaveProfile"
      />

      <SettingsBrandPanel
        v-model:active-panel="brandEditorPanel"
        v-model:brand-form="brandForm"
        :brand-save-state="brandSaveState"
        :brand-draft="brandDraft"
        :brand-override-count="brandOverrideCount"
        :language-options-count="languageOptions.length"
        :theme-names="THEME_NAMES"
        @save="handleSaveBrand"
      />

      <div class="divider divider-primary">
        {{ t("settings.preferences.title") }}
      </div>

      <SectionGrid grid-token="twoColumnXl">
        <SettingsPreferencesPanel
          v-model:preferences-language="preferencesLanguage"
          v-model:notification-form="notificationForm"
          :theme="theme"
          :theme-names="THEME_NAMES"
          :language-options="languageOptions"
          :preferences-save-state="preferencesSaveState"
          @save="handleSavePreferences"
          @toggle-theme="handleToggleTheme"
        />

        <SettingsAutomationPanel
          v-model:automation-form="automationForm"
          :automation-browser-options="automationBrowserOptionItems"
          @save="handleSaveAutomation"
        />

        <SettingsJobIntelligencePanel
          v-model:job-provider-form="jobProviderForm"
          v-model:job-taxonomy-form="jobTaxonomyForm"
          :provider-save-state="jobProvidersSaveState"
          :taxonomy-save-state="jobTaxonomySaveState"
          @save-providers="handleSaveJobProviders"
          @save-taxonomy="handleSaveJobTaxonomy"
        />

        <SettingsEmailDeliveryPanel
          v-model:email-transport-form="emailTransportForm"
          v-model:email-transport-password-draft="emailTransportPasswordDraft"
          :email-delivery-configured="emailDeliveryConfigured"
          :has-stored-password="settings?.hasEmailTransportPassword ?? false"
          :resolved-brand-name="resolvedBrand.name"
          :security-option-labels="securityOptionLabels"
          :auth-mode-option-labels="authModeOptionLabels"
          @save-settings="handleSaveEmailDeliverySettings"
          @save-password="handleSaveEmailDeliveryPassword"
          @clear-password="handleClearEmailDeliveryPassword"
        />
      </SectionGrid>

      <div class="divider divider-primary">
        {{ t("settings.aiProviders.title") }}
      </div>

      <SettingsAIProvidersPanel
        v-model:preferred-provider-selection="preferredProviderSelection"
        v-model:ai-routing-draft="aiRoutingDraft"
        v-model:api-keys="apiKeys"
        :provider-inputs="providerInputs"
        :ai-routing-sections="aiRoutingSections"
        :routing-model-options="routingModelOptions"
        :provider-configured-by-id="providerConfiguredById"
        :provider-diagnostics="providerDiagnostics"
        :test-results="testResults"
        :testing-provider="testingProvider"
        :show-ollama-hot-tip="showOllamaHotTip"
        @save-preferred-provider="handleSavePreferredProvider"
        @save-routing="handleSaveRouting"
        @test-provider="handleTest"
        @save-keys="handleSaveKeys"
      />
    </div>
  </PageScaffold>
</template>
