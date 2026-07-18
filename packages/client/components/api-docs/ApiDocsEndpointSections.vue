<script setup lang="ts">
import { SHADOW_TOKEN_CLASS, RADIUS_TOKEN_CLASS } from "~/constants/layout";
import type { ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import type { ApiEndpoint, ApiEndpointGroup, ApiHttpMethod } from "~/types/api-docs";

defineProps<{
  endpointGroups: readonly ApiEndpointGroup[];
  methodLabel: (method: ApiHttpMethod) => string;
  methodBadgeClass: (method: ApiHttpMethod) => string;
  registerEndpointSectionRef: (
    endpointId: string,
  ) => (element: Element | ComponentPublicInstance | null) => void;
}>();

const emit = defineEmits<{
  openTester: [endpoint: ApiEndpoint, invoker: EventTarget | null];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="min-w-0 flex-1 space-y-6">
    <section
      v-for="group in endpointGroups"
      :key="group.id"
      class="card border border-base-200 bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]"
    >
      <div class="card-body space-y-5">
        <h2 class="card-title">{{ group.label }}</h2>

        <article
          v-for="endpoint in group.endpoints"
          :id="endpoint.id"
          :key="endpoint.id"
          :ref="registerEndpointSectionRef(endpoint.id)"
          class="space-y-4 border border-base-200 bg-base-100 p-4 scroll-mt-24" :class="[RADIUS_TOKEN_CLASS.lg]"
        >
          <header class="flex min-w-0 flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-2">
              <p class="flex min-w-0 flex-wrap items-center gap-2">
                <span :class="methodBadgeClass(endpoint.method)">
                  {{ methodLabel(endpoint.method) }}
                </span>
                <span class="min-w-0 break-all font-mono text-sm">{{ endpoint.path }}</span>
              </p>
              <h3 class="text-lg font-semibold break-words">
                {{ endpoint.operation.summary || endpoint.operation.operationId || endpoint.path }}
              </h3>
              <p class="text-sm text-secondary break-words">
                {{ endpoint.operation.description || t("apiDocs.endpoint.noDescription") }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              :aria-label="
                t('apiDocs.endpoint.openTesterAria', {
                  method: methodLabel(endpoint.method),
                  path: endpoint.path,
                })
              "
              @click="emit('openTester', endpoint, $event.currentTarget)"
            >
              {{ t("apiDocs.endpoint.openTester") }}
            </button>
          </header>

          <SectionGrid grid-token="twoColumn">
            <div class="border border-base-200 p-3" :class="[RADIUS_TOKEN_CLASS.lg]">
              <p class="text-xs font-semibold uppercase text-muted">
                {{ t("apiDocs.endpoint.methodLabel") }}
              </p>
              <p class="mt-1 font-mono text-sm">{{ methodLabel(endpoint.method) }}</p>
            </div>
            <div class="border border-base-200 p-3" :class="[RADIUS_TOKEN_CLASS.lg]">
              <p class="text-xs font-semibold uppercase text-muted">
                {{ t("apiDocs.endpoint.operationIdLabel") }}
              </p>
              <p class="mt-1 text-sm">
                {{ endpoint.operation.operationId || t("apiDocs.endpoint.noDescription") }}
              </p>
            </div>
          </SectionGrid>
        </article>
      </div>
    </section>
  </div>
</template>
