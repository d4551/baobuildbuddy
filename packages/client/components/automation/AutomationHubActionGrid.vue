<script setup lang="ts">
import {
  UI_STAGGER_INDEX_MAX,
} from "~/constants/numeric-ui";
import { useI18n } from "vue-i18n";
import { resolveAppIconComponent } from "~/components/icons/icon-registry";
import type { AutomationHubCard } from "~/composables/automation-hub-page-contracts";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_HEIGHT_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  RADIUS_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_PRIMARY_OUTLINE_CLASS,
} from "~/constants/layout-badges";

defineProps<{
  orderedCards: readonly AutomationHubCard[];
  primaryCardId: AutomationHubCard["id"] | null;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <UiGlassCard
      v-for="(card, index) in orderedCards"
      :key="card.id"
      :selected="primaryCardId === card.id"
      :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
      :extra-class="FLUID_HEIGHT_CLASS"
    >
      <div class="card-body">
        <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="tooltip tooltip-bottom" :data-tip="t(card.titleKey)">
              <span
                class="inline-flex items-center justify-center border border-primary/30 bg-primary/10 text-primary"
                :class="[RADIUS_TOKEN_CLASS.full, ICON_SIZE_CLASS[8]]"
              >
                <component
                  :is="resolveAppIconComponent(card.iconName)"
                  :class="[ICON_SIZE_CLASS[4]]"
                  aria-hidden="true"
                />
                <span class="sr-only">{{ t(card.titleKey) }}</span>
              </span>
            </span>
            <h2 class="card-title">{{ t(card.titleKey) }}</h2>
          </div>
          <span v-if="primaryCardId === card.id" :class="[BADGE_PRIMARY_OUTLINE_CLASS]">
            {{ t("automation.hub.pipelineTitle") }}
          </span>
        </div>
        <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t(card.descriptionKey) }}</p>
        <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt4]">
          <NuxtLink :to="card.to" :class="[OUTLINE_ACTION_CLASS]" :aria-label="t(card.buttonKey)">
            {{ t(card.buttonKey) }}
          </NuxtLink>
        </div>
      </div>
    </UiGlassCard>
  </SectionGrid>
</template>
