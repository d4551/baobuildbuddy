<script setup lang="ts">
import { RESPONSIVE_WIDTH_LG_W80_CLASS } from "~/constants/ui-layout";
import { useI18n } from "vue-i18n";
import {

  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRACKING_TOKEN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS,
  TOUCH_TARGET_MIN_CLASS,
} from "~/constants/layout";
import type { ApiEndpointGroup, ApiHttpMethod } from "~/types/api-docs";

defineProps<{
  endpointGroups: readonly ApiEndpointGroup[];
  activeEndpointId: string;
  methodLabel: (method: ApiHttpMethod) => string;
  methodBadgeClass: (method: ApiHttpMethod) => string;
}>();

const emit = defineEmits<{
  navigate: [endpointId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <aside :class="[SURFACE_GLASS_CARD_CLASS, 'lg:sticky', 'lg:top-6', RESPONSIVE_WIDTH_LG_W80_CLASS, 'lg:shrink-0']">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <h2 class="card-title text-base">{{ t("apiDocs.endpointNavigator") }}</h2>
      <nav :aria-label="t('apiDocs.a11y.endpointNavigation')">
        <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <li v-for="group in endpointGroups" :key="group.id" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <p class="font-semibold uppercase text-muted" :class="[TRACKING_TOKEN_CLASS.wide, TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ group.label }}
            </p>
            <ul :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
              <li v-for="endpoint in group.endpoints" :key="endpoint.id">
                <button class="btn btn-sm btn-ghost h-auto justify-start whitespace-normal text-start" type="button" :class="[TOUCH_TARGET_MIN_CLASS, FLUID_WIDTH_CLASS, { [PRIMARY_BUTTON_VARIANT_CLASS]: activeEndpointId === endpoint.id }, PADDING_TOKEN_CLASS.py2]" :aria-label=" t('apiDocs.endpoint.navigateAria', { method: methodLabel(endpoint.method), path: endpoint.path, }) " :aria-current="activeEndpointId === endpoint.id ? 'location' : undefined" @click="emit('navigate', endpoint.id)">
                  <span :class="[methodBadgeClass(endpoint.method), MARGIN_TOKEN_CLASS.me2]">
                    {{ methodLabel(endpoint.method) }}
                  </span>
                  <span class="break-all font-mono" :class="[TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS.xs]">{{ endpoint.path }}</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
