<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AutomationHubCard } from "~/composables/automation-hub-page-contracts";

defineProps<{
  orderedCards: readonly AutomationHubCard[];
  primaryCardId: AutomationHubCard["id"] | null;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoToFour">
    <div
      v-for="card in orderedCards"
      :key="card.id"
      class="card card-border bg-base-100 transition-colors hover:bg-base-200"
      :class="primaryCardId === card.id ? 'ring-2 ring-primary/40' : ''"
    >
      <div class="card-body">
        <div class="flex items-center justify-between gap-2">
          <h2 class="card-title">{{ t(card.titleKey) }}</h2>
          <span v-if="primaryCardId === card.id" class="badge badge-primary badge-outline">
            {{ t("automation.hub.pipelineTitle") }}
          </span>
        </div>
        <p class="text-sm">{{ t(card.descriptionKey) }}</p>
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
