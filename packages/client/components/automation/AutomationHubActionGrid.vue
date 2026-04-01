<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import type { AutomationHubCard } from "~/composables/automation-hub-page-contracts";

defineProps<{
  orderedCards: readonly AutomationHubCard[];
  primaryCardId: AutomationHubCard["id"] | null;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <div
      v-for="card in orderedCards"
      :key="card.id"
      class="card card-border h-full bg-base-100 transition-colors hover:bg-base-200"
      :class="primaryCardId === card.id ? 'ring-2 ring-primary/40' : ''"
    >
      <div class="card-body">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="tooltip tooltip-bottom" :data-tip="t(card.titleKey)">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"
              >
                <component
                  :is="resolveAppIconComponent(card.iconName)"
                  class="h-4 w-4"
                  aria-hidden="true"
                />
                <span class="sr-only">{{ t(card.titleKey) }}</span>
              </span>
            </span>
            <h2 class="card-title">{{ t(card.titleKey) }}</h2>
          </div>
          <span v-if="primaryCardId === card.id" class="badge badge-primary badge-outline">
            {{ t("automation.hub.pipelineTitle") }}
          </span>
        </div>
        <p class="text-sm text-base-content/70">{{ t(card.descriptionKey) }}</p>
        <div class="card-actions mt-4 justify-end">
          <NuxtLink
            :to="card.to"
            class="btn btn-outline"
            :class="{ 'btn-primary': primaryCardId === card.id }"
            :aria-label="t(card.buttonKey)"
          >
            {{ t(card.buttonKey) }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </SectionGrid>
</template>
