<script setup lang="ts">
import {
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
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
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <header :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
        <h2 :id="dialogTitleId" class="text-xl font-semibold">
          {{ t("apiDocs.tester.title") }}
        </h2>
        <p
          v-if="selectedEndpoint"
          :id="dialogDescriptionId"
          class="font-mono text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]"
        >
          <span :class="methodBadgeClass(selectedEndpoint.method)">
            {{ methodLabel(selectedEndpoint.method) }}
          </span>
          <span class="ml-2">{{ selectedEndpoint.path }}</span>
        </p>
      </header>

      <section :aria-label="t('apiDocs.tester.lifecycleTitle')" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
        <h3 class="font-medium">{{ t("apiDocs.tester.lifecycleTitle") }}</h3>
        <ul class="steps steps-vertical lg:steps-horizontal" :class="[FLUID_WIDTH_CLASS]">
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
        :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]"
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
        :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]"
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
        :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]"
      >
        <h3 class="font-medium">{{ t("apiDocs.tester.requestBodyIntro") }}</h3>
        <textarea
          :value="requestBodyValue"
          class="textarea font-mono" :class="[MIN_HEIGHT_SCROLL_CLASS, FLUID_WIDTH_CLASS, TYPOGRAPHY_SCALE_CLASS.sm]"
          :placeholder="t('apiDocs.tester.bodyPlaceholder')"
          :aria-label="t('apiDocs.tester.requestBodyAria')"
          @input="updateRequestBodyValue"
        />
        <p
          v-if="!selectedEndpoint.requestBodyTemplate && !selectedEndpoint.requestBodyRequired"
          class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]"
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
          <LoadingSpinner size="sm" label="Loading" v-if="testerState === 'loading'" />
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

      <section :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]" :aria-label="t('apiDocs.tester.responseTitle')">
        <h3 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h3>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ testerStateLabel }}</p>

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

        <div v-if="testerResponse" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
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

          <div :class="STACK_SPACE_Y_TOKEN_CLASS.stack1">
            <h4 class="font-medium">{{ t("apiDocs.tester.responseHeadersLabel") }}</h4>
            <pre class="bg-base-200 whitespace-pre-wrap" :class="[PADDING_TOKEN_CLASS.p3, TYPOGRAPHY_SCALE_CLASS.xs, RADIUS_TOKEN_CLASS.lg]">{{
              Object.keys(testerResponse.headers).length > 0
                ? JSON.stringify(testerResponse.headers, null, 2)
                : t("apiDocs.tester.noResponseHeaders")
            }}</pre>
          </div>

          <div :class="STACK_SPACE_Y_TOKEN_CLASS.stack1">
            <h4 class="font-medium">{{ t("apiDocs.tester.responseTitle") }}</h4>
            <pre class="bg-base-200 whitespace-pre-wrap" :class="[PADDING_TOKEN_CLASS.p3, TYPOGRAPHY_SCALE_CLASS.xs, RADIUS_TOKEN_CLASS.lg]">{{
              formattedResponseBody || t("apiDocs.tester.emptyResponse")
            }}</pre>
          </div>
        </div>
      </section>
    </div>
  </AppModalFrame>
</template>
