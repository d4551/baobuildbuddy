<script setup lang="ts">
import type { GameStudio } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import {
  BADGE_GHOST_CLASS,
  BADGE_OUTLINE_CLASS,
  BADGE_PRIMARY_CLASS,
  BADGE_SUCCESS_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CIRCLE_DENSE_CLASS,
  GHOST_ACTION_CLASS,
  ICON_SIZE_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { studioSizeLabel, studioTypeLabel } from "~/utils/labels";

const open = defineModel<boolean>("open", { required: true });


defineProps<{
  studio: GameStudio | null;
  titleId: string;
}>();

defineEmits<{
  close: [];
  openDetail: [id: string];
  startInterview: [id: string];
}>();
const { t } = useI18n();

function studioDescription(description: string | undefined): string {
  return description?.trim() || t("studiosIndex.card.noDescription");
}

function studioLocation(location: string): string {
  return location.trim() || t("studiosIndex.card.unknownLocation");
}
</script>

<template>
  <AppModalFrame
    v-model:open="open"
    :title-id="titleId"
    size-token="standard"
    :close-aria-label="t('studiosIndex.preview.closeButtonAria')"
    :close-backdrop-label="t('studiosIndex.preview.closeBackdropButton')"
    @close="$emit('close')"
  >
    <button 
      type="button"
      class="absolute end-2 top-2"
      :class="[GHOST_ACTION_CIRCLE_DENSE_CLASS, TOUCH_TARGET_MIN_CLASS]"
      :aria-label="t('studiosIndex.preview.closeButtonAria')"
      @click="$emit('close')"
    >
      <CloseIcon :class="[ICON_SIZE_CLASS[4]]"/>
    </button>

    <template v-if="studio">
      <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl]" :id="titleId">
        {{ studio.name }}
      </h3>
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ studioDescription(studio.description) }}
      </p>

      <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt4]">
        <span :class="BADGE_PRIMARY_CLASS">{{ studioTypeLabel(t, studio.type) }}</span>
        <span :class="BADGE_OUTLINE_CLASS">{{ studioSizeLabel(t, studio.size) }}</span>
        <span :class="BADGE_GHOST_CLASS">{{ studioLocation(studio.location) }}</span>
        <span v-if="studio.remoteWork" :class="BADGE_SUCCESS_CLASS">
          {{ t("studiosIndex.card.remoteBadge") }}
        </span>
      </div>

      <SectionGrid :class="[MARGIN_TOKEN_CLASS.mt5]" grid-token="threeColumnMd">
        <div :class="[INSET_PANEL_CLASS, 'stat']">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.interviewReadyTitle") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ t("studiosIndex.preview.stats.interviewReadyValue") }}</div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.interviewReadyDesc") }}</div>
        </div>
        <div :class="[INSET_PANEL_CLASS, 'stat']">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.locationTitle") }}</div>
          <div class="stat-value text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
            {{ studioLocation(studio.location) }}
          </div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.locationDesc") }}</div>
        </div>
        <div :class="[INSET_PANEL_CLASS, 'stat']">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.remoteTitle") }}</div>
          <div class="stat-value text-accent" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
            {{ studio.remoteWork ? t("studiosIndex.preview.remoteYes") : t("studiosIndex.preview.remoteNo") }}
          </div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.remoteDesc") }}</div>
        </div>
      </SectionGrid>

      <div class="modal-action">
        <button 
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('studiosIndex.preview.startInterviewAria', { studio: studio.name })"
          @click="$emit('startInterview', studio.id)"
        >
          {{ t("studiosIndex.preview.startInterviewButton") }}
        </button>
        <button 
          type="button"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('studiosIndex.preview.openDetailAria', { studio: studio.name })"
          @click="$emit('openDetail', studio.id)"
        >
          {{ t("studiosIndex.preview.openDetailButton") }}
        </button>
        <button 
          type="button"
          :class="GHOST_ACTION_CLASS"
          :aria-label="t('studiosIndex.preview.closeButtonAria')"
          @click="$emit('close')"
        >
          {{ t("studiosIndex.preview.closeButton") }}
        </button>
      </div>
    </template>

    <template v-else>
      <h3 :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl]" :id="titleId">
        {{ t("studiosIndex.preview.missingTitle") }}
      </h3>
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("studiosIndex.preview.missingDescription") }}
      </p>
      <div class="modal-action">
        <button 
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('studiosIndex.preview.closeButtonAria')"
          @click="$emit('close')"
        >
          {{ t("studiosIndex.preview.closeButton") }}
        </button>
      </div>
    </template>
  </AppModalFrame>
</template>
