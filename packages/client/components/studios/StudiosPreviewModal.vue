<script setup lang="ts">
import type { GameStudio } from "@bao/shared/types/interview";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { studioSizeLabel, studioTypeLabel } from "~/utils/labels";

defineProps<{
  studio: GameStudio | null;
  titleId: string;
}>();

defineEmits<{
  close: [];
  openDetail: [id: string];
  startInterview: [id: string];
}>();

const open = defineModel<boolean>("open", { required: true });
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
      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
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
        <span class="badge badge-primary">{{ studioTypeLabel(t, studio.type) }}</span>
        <span class="badge badge-outline">{{ studioSizeLabel(t, studio.size) }}</span>
        <span class="badge badge-ghost">{{ studioLocation(studio.location) }}</span>
        <span v-if="studio.remoteWork" class="badge badge-success">
          {{ t("studiosIndex.card.remoteBadge") }}
        </span>
      </div>

      <SectionGrid :class="[MARGIN_TOKEN_CLASS.mt5]" grid-token="threeColumnMd">
        <div class="stat rounded-box border border-base-300 bg-base-100">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.interviewReadyTitle") }}</div>
          <div class="stat-value text-primary" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ t("studiosIndex.preview.stats.interviewReadyValue") }}</div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.interviewReadyDesc") }}</div>
        </div>
        <div class="stat rounded-box border border-base-300 bg-base-100">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.locationTitle") }}</div>
          <div class="stat-value text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">
            {{ studioLocation(studio.location) }}
          </div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.locationDesc") }}</div>
        </div>
        <div class="stat rounded-box border border-base-300 bg-base-100">
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
          class="btn btn-primary"
          :aria-label="t('studiosIndex.preview.startInterviewAria', { studio: studio.name })"
          @click="$emit('startInterview', studio.id)"
        >
          {{ t("studiosIndex.preview.startInterviewButton") }}
        </button>
        <button 
          type="button"
          class="btn btn-outline"
          :aria-label="t('studiosIndex.preview.openDetailAria', { studio: studio.name })"
          @click="$emit('openDetail', studio.id)"
        >
          {{ t("studiosIndex.preview.openDetailButton") }}
        </button>
        <button 
          type="button"
          class="btn btn-ghost"
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
          class="btn btn-primary"
          :aria-label="t('studiosIndex.preview.closeButtonAria')"
          @click="$emit('close')"
        >
          {{ t("studiosIndex.preview.closeButton") }}
        </button>
      </div>
    </template>
  </AppModalFrame>
</template>
