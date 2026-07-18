<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_HEIGHT_CLASS, MARGIN_TOKEN_CLASS, RADIUS_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
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
      class="card card-border bg-base-100 transition-colors hover:bg-base-200" :class="[FLUID_HEIGHT_CLASS, primaryCardId === card.id ? 'ring-2 ring-primary/40' : '']"
    >
      <div class="card-body">
        <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="tooltip tooltip-bottom" :data-tip="t(card.titleKey)">
              <span
                class="inline-flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary" :class="[RADIUS_TOKEN_CLASS.full]"
              >
                <component
                  :is="resolveAppIconComponent(card.iconName)"
                  :class="ICON_SIZE_CLASS['4']"
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
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t(card.descriptionKey) }}</p>
        <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt4]">
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
