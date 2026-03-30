<script setup lang="ts">
import type { GameStudio } from "@bao/shared";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
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
      <CloseIcon class="h-4 w-4" />
    </button>

    <template v-if="studio">
      <h3 :id="titleId" class="text-xl font-bold">
        {{ studio.name }}
      </h3>
      <p class="mt-2 text-sm text-base-content/70">
        {{ studioDescription(studio.description) }}
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <span class="badge badge-primary">{{ studioTypeLabel(t, studio.type) }}</span>
        <span class="badge badge-outline">{{ studioSizeLabel(t, studio.size) }}</span>
        <span class="badge badge-ghost">{{ studioLocation(studio.location) }}</span>
        <span v-if="studio.remoteWork" class="badge badge-success">
          {{ t("studiosIndex.card.remoteBadge") }}
        </span>
      </div>

      <SectionGrid grid-token="threeColumnMd" extra-class="mt-5">
        <div class="stat rounded-box border border-base-300 bg-base-100">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.interviewReadyTitle") }}</div>
          <div class="stat-value text-primary text-2xl">{{ t("studiosIndex.preview.stats.interviewReadyValue") }}</div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.interviewReadyDesc") }}</div>
        </div>
        <div class="stat rounded-box border border-base-300 bg-base-100">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.locationTitle") }}</div>
          <div class="stat-value text-secondary text-lg">
            {{ studioLocation(studio.location) }}
          </div>
          <div class="stat-desc">{{ t("studiosIndex.preview.stats.locationDesc") }}</div>
        </div>
        <div class="stat rounded-box border border-base-300 bg-base-100">
          <div class="stat-title">{{ t("studiosIndex.preview.stats.remoteTitle") }}</div>
          <div class="stat-value text-accent text-lg">
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
      <h3 :id="titleId" class="text-xl font-bold">
        {{ t("studiosIndex.preview.missingTitle") }}
      </h3>
      <p class="mt-2 text-sm text-base-content/70">
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
