<script setup lang="ts">
import { SHADOW_TOKEN_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";
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
  <aside class="card bg-base-100 lg:sticky lg:top-6 lg:w-80 lg:shrink-0" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="card-body gap-4">
      <h2 class="card-title text-base">{{ t("apiDocs.endpointNavigator") }}</h2>
      <nav :aria-label="t('apiDocs.a11y.endpointNavigation')">
        <ul class="space-y-4">
          <li v-for="group in endpointGroups" :key="group.id" class="space-y-2">
            <p class="text-sm font-semibold uppercase tracking-wide text-muted">
              {{ group.label }}
            </p>
            <ul class="space-y-2">
              <li v-for="endpoint in group.endpoints" :key="endpoint.id">
                <button
                  type="button"
                  class="btn btn-sm btn-ghost h-auto w-full justify-start whitespace-normal py-2 text-left"
                  :class="{ 'btn-primary': activeEndpointId === endpoint.id }"
                  :aria-label="
                    t('apiDocs.endpoint.navigateAria', {
                      method: methodLabel(endpoint.method),
                      path: endpoint.path,
                    })
                  "
                  :aria-current="activeEndpointId === endpoint.id ? 'location' : undefined"
                  @click="emit('navigate', endpoint.id)"
                >
                  <span :class="methodBadgeClass(endpoint.method)" class="mr-2">
                    {{ methodLabel(endpoint.method) }}
                  </span>
                  <span class="min-w-0 break-all font-mono text-xs">{{ endpoint.path }}</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
