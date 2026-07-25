<script setup lang="ts">
import type { GameStudio } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  MIN_HEIGHT_DESCRIPTION_CLASS,
  RADIUS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  WIDTH_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  PRIMARY_ACTION_CLASS,
  OUTLINE_ACTION_CLASS,
} from "~/constants/layout";
import { studioSizeLabel, studioTypeLabel } from "~/utils/labels";

defineProps<{
  hasAdditionalStudios: boolean;
  studios: GameStudio[];
}>();

defineEmits<{
  loadMore: [];
  preview: [id: string];
  view: [id: string];
}>();

const { t } = useI18n();

function studioInitial(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0) {
    return "?";
  }
  return normalized[0]?.toUpperCase() ?? "?";
}

function studioDescription(description: string | undefined): string {
  return description?.trim() || t("studiosIndex.card.noDescription");
}

function studioLocation(location: string): string {
  return location.trim() || t("studiosIndex.card.unknownLocation");
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <SectionGrid grid-token="threeColumn">
      <article 
        v-for="studio in studios"
        :key="studio.id"
        :class="[SURFACE_GLASS_CARD_CLASS, 'transition-shadow']"
      >
        <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
          <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content" :class="[RADIUS_TOKEN_CLASS.full, WIDTH_TOKEN_CLASS.w12]">
                <span :class="[TYPOGRAPHY_SCALE_CLASS.xl]">{{ studioInitial(studio.name) }}</span>
              </div>
            </div>
            <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
              <h2 class="card-title truncate" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ studio.name }}</h2>
              <p class="text-muted truncate" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ studioLocation(studio.location) }}</p>
            </div>
          </div>

          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm, MIN_HEIGHT_DESCRIPTION_CLASS]">
            {{ studioDescription(studio.description) }}
          </p>

          <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="badge badge-primary badge-sm">{{ studioTypeLabel(t, studio.type) }}</span>
            <span class="badge badge-outline badge-sm">{{ studioSizeLabel(t, studio.size) }}</span>
            <span v-if="studio.remoteWork" class="badge badge-success badge-sm">
              {{ t("studiosIndex.card.remoteBadge") }}
            </span>
          </div>

          <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt1]">
            <button 
              :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-ghost btn-sm']"
              :aria-label="t('studiosIndex.card.previewAria', { studio: studio.name })"
              @click="$emit('preview', studio.id)"
            >
              {{ t("studiosIndex.card.previewButton") }}
            </button>
            <button 
              :class="[PRIMARY_ACTION_CLASS]"
              :aria-label="t('studiosIndex.card.viewAria', { studio: studio.name })"
              @click="$emit('view', studio.id)"
            >
              {{ t("studiosIndex.card.viewButton") }}
            </button>
          </div>
        </div>
      </article>
    </SectionGrid>

    <div v-if="hasAdditionalStudios" class="flex justify-center">
      <button 
        type="button"
        :class="[OUTLINE_ACTION_CLASS]"
        :aria-label="t('studiosIndex.list.loadMoreAria')"
        @click="$emit('loadMore')"
      >
        {{ t("studiosIndex.list.loadMoreButton") }}
      </button>
    </div>
  </div>
</template>
