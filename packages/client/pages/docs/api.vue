<script setup lang="ts">
defineOptions({ name: "PagesDocsApiPage" });

import { useI18n } from "vue-i18n";
import { definePageMeta, useSeoMeta } from "#imports";

definePageMeta({
  middleware: ["auth"],
});
const { t } = useI18n();
useSeoMeta({
  title: t("apiDocs.seoTitle"),
  description: t("apiDocs.seoDescription"),
});

const {
  docsUiState,
  endpointGroups,
  activeEndpointId,
  testerDialogOpen,
  selectedEndpoint,
  testerState,
  testerStateLabel,
  pathParameterValues,
  queryParameterValues,
  requestBodyValue,
  testerErrorMessage,
  testerResponse,
  formattedResponseBody,
  refreshSpec,
  methodLabel,
  methodBadgeClass,
  scrollToEndpoint,
  openEndpointTester,
  registerEndpointSectionRef,
  handleEndpointTesterClosed,
  executeEndpointRequest,
  API_TESTER_DIALOG_TITLE_ID,
  API_TESTER_DIALOG_DESCRIPTION_ID,
} = useApiDocsPage(t);
</script>

<template>
  <PageScaffold labelled-by="api-docs-title">
    <PageHeroHeader
      title-id="api-docs-title"
      :title="t('apiDocs.title')"
      :description="t('apiDocs.intro')"
    />

    <div v-if="docsUiState === 'loading'" role="status" aria-live="polite" :aria-label="t('apiDocs.state.loading')">
      <LoadingSkeleton :lines="6" />
    </div>

    <EmptyState
      v-else-if="docsUiState === 'empty'"
      title-key="apiDocs.title"
      description-key="apiDocs.state.empty"
      cta-label-key="apiDocs.actions.retry"
      cta-aria-key="apiDocs.actions.retry"
      @cta="refreshSpec"
    />

    <BootstrapErrorAlert
      v-else-if="docsUiState === 'unauthorized' || docsUiState === 'errorRetryable' || docsUiState === 'errorNonRetryable'"
      :message="t(`apiDocs.state.${docsUiState}`)"
      :retry-label="docsUiState === 'errorRetryable' ? t('apiDocs.actions.retry') : ''"
      :retry-aria-label="docsUiState === 'errorRetryable' ? t('apiDocs.actions.retry') : ''"
      @retry="refreshSpec"
    />

    <SectionGrid v-else grid-token="sidebar">
      <ApiDocsEndpointNavigator
        :endpoint-groups="endpointGroups"
        :active-endpoint-id="activeEndpointId"
        :method-label="methodLabel"
        :method-badge-class="methodBadgeClass"
        @navigate="scrollToEndpoint"
      />

      <ApiDocsEndpointSections
        :endpoint-groups="endpointGroups"
        :method-label="methodLabel"
        :method-badge-class="methodBadgeClass"
        :register-endpoint-section-ref="registerEndpointSectionRef"
        @open-tester="openEndpointTester"
      />
    </SectionGrid>

    <ApiEndpointTesterDialog
      v-model:open="testerDialogOpen"
      :selected-endpoint="selectedEndpoint"
      :tester-state="testerState"
      :tester-state-label="testerStateLabel"
      :path-parameter-values="pathParameterValues"
      :query-parameter-values="queryParameterValues"
      :request-body-value="requestBodyValue"
      :tester-error-message="testerErrorMessage"
      :tester-response="testerResponse"
      :formatted-response-body="formattedResponseBody"
      :dialog-title-id="API_TESTER_DIALOG_TITLE_ID"
      :dialog-description-id="API_TESTER_DIALOG_DESCRIPTION_ID"
      :method-label="methodLabel"
      :method-badge-class="methodBadgeClass"
      @close="handleEndpointTesterClosed"
      @execute="executeEndpointRequest"
      @update:path-parameter="
        ({ name, value }) => {
          pathParameterValues[name] = value;
        }
      "
      @update:query-parameter="
        ({ name, value }) => {
          queryParameterValues[name] = value;
        }
      "
      @update:request-body-value="requestBodyValue = $event"
    />
  </PageScaffold>
</template>
