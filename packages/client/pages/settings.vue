<script setup lang="ts">
import { STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS, APP_ROUTE_QUERY_KEYS } from "@bao/shared/constants/routes";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSeoMeta } from "#imports";
import {
  isSettingsSectionId,
  SETTINGS_DEFAULT_SECTION_ID,
  type SettingsSectionId,
} from "~/components/settings/settings-sections";
import { useSettings } from "~/composables/useSettings";
import { useSettingsPage } from "~/composables/useSettingsPage";
import { PRIMARY_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS } from "~/constants/layout";
import { getErrorMessage } from "~/utils/errors";
import { resolveRouteSectionId } from "~/utils/route-query";

const { t } = useI18n();
const route = useRoute();
const { isAiConfigurationIncomplete } = useSettings();
const aiProvidersSettingsRoute = APP_ROUTE_BUILDERS.settingsSection("aiProviders");

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

const routeSection = computed<SettingsSectionId>(() =>
  resolveRouteSectionId(
    route.query[APP_ROUTE_QUERY_KEYS.section],
    isSettingsSectionId,
    SETTINGS_DEFAULT_SECTION_ID,
  ),
);
const activeSection = ref<SettingsSectionId>(routeSection.value);

watch(
  routeSection,
  (value) => {
    activeSection.value = value;
  },
  { immediate: true },
);
</script>

<template>
  <PageScaffold labelled-by="settings-page-title">
    <PageHeaderBlock
      title-id="settings-page-title"
      :title="t('settings.title')"
      :description="t('settings.subtitle')"
      description-class="text-secondary"
    />

    <div
      v-if="isAiConfigurationIncomplete"
      class="alert alert-warning sm:alert-horizontal"
      role="status"
    >
      <span>{{ t("a11y.aiConfigIncompleteAria") }}</span>
      <NuxtLink
        :to="aiProvidersSettingsRoute"
        :class="[PRIMARY_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS]"
        :aria-label="t('settings.aiProviders.configureCtaAria')"
      >
        {{ t("settings.aiProviders.configureCta") }}
      </NuxtLink>
    </div>

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

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <SettingsSectionTabs v-model:active-section="activeSection">
        <template #profile>
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
            <!-- Auth first — rotate/revoke must clear fold before long profile form. -->
            <SettingsAuthAccessCard />
            <SettingsProfilePanel
              v-model:profile-form="profileForm"
              :profile-save-state="profileSaveState"
              @save="handleSaveProfile"
            />
          </div>
        </template>

        <template #preferences>
          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
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
            <SettingsWorkspaceBackupCard />
          </div>
        </template>

        <template #automation>
          <SettingsAutomationPanel
            v-model:automation-form="automationForm"
            :automation-browser-options="automationBrowserOptionItems"
            @save="handleSaveAutomation"
          />
        </template>

        <template #job-intelligence>
          <SettingsJobIntelligencePanel
            v-model:job-provider-form="jobProviderForm"
            v-model:job-taxonomy-form="jobTaxonomyForm"
            :provider-save-state="jobProvidersSaveState"
            :taxonomy-save-state="jobTaxonomySaveState"
            @save-providers="handleSaveJobProviders"
            @save-taxonomy="handleSaveJobTaxonomy"
          />
        </template>

        <template #email-delivery>
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
        </template>

        <template #ai-providers>
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
        </template>

        <template #brand>
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
        </template>
      </SettingsSectionTabs>
    </div>
  </PageScaffold>
</template>
