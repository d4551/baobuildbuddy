<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import type {
  ApiEndpoint,
  ApiHttpMethod,
  ApiTesterState,
  FetchEndpointResultOk,
} from "~/types/api-docs";

defineProps<{
  open: boolean;
  selectedEndpoint: ApiEndpoint | null;
  testerState: ApiTesterState;
  testerStateLabel: string;
  pathParameterValues: Record<string, string>;
  queryParameterValues: Record<string, string>;
  requestBodyValue: string;
  testerErrorMessage: string;
  testerResponse: FetchEndpointResultOk | null;
  formattedResponseBody: string;
  dialogTitleId: string;
  dialogDescriptionId: string;
  methodLabel: (method: ApiHttpMethod) => string;
  methodBadgeClass: (method: ApiHttpMethod) => string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
  execute: [];
  "update:path-parameter": [payload: { name: string; value: string }];
  "update:query-parameter": [payload: { name: string; value: string }];
  "update:request-body-value": [value: string];
}>();

const { t } = useI18n();

function updatePathParameter(name: string, event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:path-parameter", { name, value: target.value });
  }
}

function updateQueryParameter(name: string, event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:query-parameter", { name, value: target.value });
  }
}

function updateRequestBodyValue(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit("update:request-body-value", target.value);
  }
}
</script>

<template>
  <AppModalFrame
    :open="open"
    :title-id="dialogTitleId"
    :described-by-id="selectedEndpoint ? dialogDescriptionId : undefined"
    size-token="wide"
    :close-aria-label="t('apiDocs.tester.closeAria')"
    :close-backdrop-label="t('apiDocs.tester.close')"
    @update:open="emit('update:open', $event)"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <header class="space-y-2">
        <h2 :id="dialogTitleId" class="text-xl font-semibold">
          {{ t("apiDocs.tester.title") }}
        </h2>
        <p
          v-if="selectedEndpoint"
          :id="dialogDescriptionId"
          class="font-mono text-sm text-base-content/80"
        >
          <span :class="methodBadgeClass(selectedEndpoint.method)">
            {{ methodLabel(selectedEndpoint.method) }}
          </span>
          <span class="ml-2">{{ selectedEndpoint.path }}</span>
        </p>
      </header>

      <section :aria-label="t('apiDocs.tester.lifecycleTitle')" class="space-y-3">
        <h3 class="font-medium">{{ t("apiDocs.tester.lifecycleTitle") }}</h3>
        <ul class="steps steps-vertical w-full lg:steps-horizontal">
          <li class="step" :class="{ 'step-primary': testerState !== 'idle' }">
            {{ t("apiDocs.tester.steps.configure") }}
          </li>
          <li class="step" :class="{ 'step-primary': testerState !== 'idle' && testerState !== 'loading' }">
            {{ t("apiDocs.tester.steps.send") }}
          </li>
          <li
            class="step"
            :class="{
              'step-success': testerState === 'success' || testerState === 'empty',
              'step-error':
                testerState === 'errorRetryable' ||
                testerState === 'errorNonRetryable' ||
                testerState === 'unauthorized',
            }"
          >
            {{ t("apiDocs.tester.steps.response") }}
          </li>
        </ul>
      </section>

      <section
        v-if="selectedEndpoint && selectedEndpoint.pathParameters.length > 0"
        :aria-label="t('apiDocs.tester.pathParametersIntro')"
        class="space-y-2"
      >
        <h3 class="font-medium">{{ t("apiDocs.tester.pathParametersIntro") }}</h3>
        <SectionGrid grid-token="twoColumnMdGap3">
          <div
            v-for="parameterName in selectedEndpoint.pathParameters"
            :key="`path-${parameterName}`"
            class="fieldset"
          >
            <span class="label">
              {{ t("apiDocs.tester.parameterLabel", { name: parameterName }) }}
            </span>
            <input
              :value="pathParameterValues[parameterName] ?? ''"
              type="text"
              class="input"
              :id="`path-param-${parameterName}`"
              :aria-label="t('apiDocs.tester.parameterLabel', { name: parameterName })"
              @input="updatePathParameter(parameterName, $event)"
            />
          </div>
        </SectionGrid>
      </section>

      <section
        v-if="selectedEndpoint && selectedEndpoint.queryParameters.length > 0"
        :aria-label="t('apiDocs.tester.queryParametersIntro')"
        class="space-y-2"
      >
        <h3 class="font-medium">{{ t("apiDocs.tester.queryParametersIntro") }}</h3>
        <SectionGrid grid-token="twoColumnMdGap3">
          <div
            v-for="parameter in selectedEndpoint.queryParameters"
            :key="`query-${parameter.name}`"
            class="fieldset"
          >
            <span class="label">
              {{ t("apiDocs.tester.parameterLabel", { name: parameter.name }) }}
            </span>
            <input
              :value="queryParameterValues[parameter.name] ?? ''"
              type="text"
              class="input"
              :id="`query-param-${parameter.name}`"
              :aria-label="t('apiDocs.tester.parameterLabel', { name: parameter.name })"
              @input="updateQueryParameter(parameter.name, $event)"
            />
          </div>
        </SectionGrid>
      </section>

      <section
        v-if="selectedEndpoint"
        :aria-label="t('apiDocs.tester.requestBodyIntro')"
        class="space-y-2"
      >
        <h3 class="font-medium">{{ t("apiDocs.tester.requestBodyIntro") }}</h3>
        <textarea
          :value="requestBodyValue"
          class="textarea min-h-40 w-full font-mono text-sm"
          :placeholder="t('apiDocs.tester.bodyPlaceholder')"
          :aria-label="t('apiDocs.tester.requestBodyAria')"
          @input="updateRequestBodyValue"
        />
        <p
          v-if="!selectedEndpoint.requestBodyTemplate && !selectedEndpoint.requestBodyRequired"
          class="text-xs text-base-content/60"
        >
          {{ t("apiDocs.tester.noRequestBodyTemplate") }}
        </p>
      </section>

      <div class="modal-action">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="testerState === 'loading'"
          :aria-label="t('apiDocs.tester.send')"
          @click="emit('execute')"
        >
          <span v-if="testerState === 'loading'" class="loading loading-spinner loading-sm"></span>
          <span v-else>{{ t("apiDocs.tester.send") }}</span>
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          :aria-label="t('apiDocs.tester.closeAria')"
          @click="emit('update:open', false)"
        >
          {{ t("apiDocs.tester.close") }}
        </button>
      </div>

      <section class="space-y-3" :aria-label="t('apiDocs.tester.responseTitle')">
        <h3 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h3>
        <p class="text-sm text-base-content/70">{{ testerStateLabel }}</p>

        <div
          v-if="testerState === 'errorRetryable' || testerState === 'errorNonRetryable' || testerState === 'unauthorized'"
          class="alert alert-error"
          role="alert"
        >
          <span>{{ testerErrorMessage || t("apiDocs.tester.errorFallback") }}</span>
        </div>

        <div v-if="testerState === 'empty'" class="alert alert-info" role="status">
          <span>{{ t("apiDocs.tester.emptyResponse") }}</span>
        </div>

        <div v-if="testerResponse" class="space-y-3">
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <caption class="sr-only">{{ t("apiDocs.tester.metadataTitle") }}</caption>
              <thead>
                <tr>
                  <th scope="col">{{ t("apiDocs.tester.metadata.columns.label") }}</th>
                  <th scope="col">{{ t("apiDocs.tester.metadata.columns.value") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ t("apiDocs.tester.metadata.responseStatus") }}</td>
                  <td>
                    {{
                      t("apiDocs.tester.responseStatusLabel", {
                        status: testerResponse.statusCode,
                        text: testerResponse.statusText,
                      })
                    }}
                  </td>
                </tr>
                <tr>
                  <td>{{ t("apiDocs.tester.metadata.duration") }}</td>
                  <td>
                    {{ t("apiDocs.tester.durationLabel", { duration: testerResponse.durationMs }) }}
                  </td>
                </tr>
                <tr>
                  <td>{{ t("apiDocs.tester.requestMethodLabel") }}</td>
                  <td class="font-mono">{{ testerResponse.method }}</td>
                </tr>
                <tr>
                  <td>{{ t("apiDocs.tester.requestUrlLabel") }}</td>
                  <td class="font-mono break-all">{{ testerResponse.url }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="space-y-1">
            <h4 class="font-medium">{{ t("apiDocs.tester.responseHeadersLabel") }}</h4>
            <pre class="rounded-lg bg-base-200 p-3 text-xs whitespace-pre-wrap">{{
              Object.keys(testerResponse.headers).length > 0
                ? JSON.stringify(testerResponse.headers, null, 2)
                : t("apiDocs.tester.noResponseHeaders")
            }}</pre>
          </div>

          <div class="space-y-1">
            <h4 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h4>
            <pre class="rounded-lg bg-base-200 p-3 text-xs whitespace-pre-wrap">{{
              formattedResponseBody || t("apiDocs.tester.emptyResponse")
            }}</pre>
          </div>
        </div>
      </section>
    </div>
  </AppModalFrame>
</template>
