<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SCROLL_MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
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
  <div class="flex-1" :class="[TRUNCATE_FLEX_CHILD_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <section 
      v-for="group in endpointGroups"
      :key="group.id"
      :class="SURFACE_GLASS_CARD_CLASS"
    >
      <div class="card-body" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack5]">
        <h2 class="card-title">{{ group.label }}</h2>

        <article 
          v-for="endpoint in group.endpoints"
          :id="endpoint.id"
          :key="endpoint.id"
          :ref="registerEndpointSectionRef(endpoint.id)"
          class="border border-base-200 bg-base-100" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4, PADDING_TOKEN_CLASS.p4, RADIUS_TOKEN_CLASS.lg, SCROLL_MARGIN_TOKEN_CLASS.scrollMt24]"
        >
          <header class="flex flex-wrap items-start justify-between" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap3]">
            <div class="flex-1" :class="[TRUNCATE_FLEX_CHILD_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2]">
              <p class="flex flex-wrap items-center" :class="[TRUNCATE_FLEX_CHILD_CLASS, FLEX_GAP_TOKEN_CLASS.gap2]">
                <span :class="methodBadgeClass(endpoint.method)">
                  {{ methodLabel(endpoint.method) }}
                </span>
                <span class="break-all font-mono" :class="[TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS.sm]">{{ endpoint.path }}</span>
              </p>
              <h3 class="font-semibold break-words" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
                {{ endpoint.operation.summary || endpoint.operation.operationId || endpoint.path }}
              </h3>
              <p class="text-secondary break-words" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
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
            <div class="border border-base-200" :class="[PADDING_TOKEN_CLASS.p3, RADIUS_TOKEN_CLASS.lg]">
              <p class="font-semibold uppercase text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{ t("apiDocs.endpoint.methodLabel") }}
              </p>
              <p class="font-mono" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">{{ methodLabel(endpoint.method) }}</p>
            </div>
            <div class="border border-base-200" :class="[PADDING_TOKEN_CLASS.p3, RADIUS_TOKEN_CLASS.lg]">
              <p class="font-semibold uppercase text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                {{ t("apiDocs.endpoint.operationIdLabel") }}
              </p>
              <p :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">
                {{ endpoint.operation.operationId || t("apiDocs.endpoint.noDescription") }}
              </p>
            </div>
          </SectionGrid>
        </article>
      </div>
    </section>
  </div>
</template>
