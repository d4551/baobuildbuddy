<script setup lang="ts">
import type { GameStudio } from "@bao/shared";
import { useI18n } from "vue-i18n";
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
  <div class="space-y-6">
    <SectionGrid grid-token="threeColumn">
      <article
        v-for="studio in studios"
        :key="studio.id"
        class="card card-border bg-base-100 transition-shadow hover:shadow-md"
      >
        <div class="card-body gap-3">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-12">
                <span class="text-xl">{{ studioInitial(studio.name) }}</span>
              </div>
            </div>
            <div class="min-w-0">
              <h2 class="card-title text-lg truncate">{{ studio.name }}</h2>
              <p class="text-xs text-base-content/60 truncate">{{ studioLocation(studio.location) }}</p>
            </div>
          </div>

          <p class="text-sm text-base-content/70 min-h-14">
            {{ studioDescription(studio.description) }}
          </p>

          <div class="flex flex-wrap gap-2">
            <span class="badge badge-primary badge-sm">{{ studioTypeLabel(t, studio.type) }}</span>
            <span class="badge badge-outline badge-sm">{{ studioSizeLabel(t, studio.size) }}</span>
            <span v-if="studio.remoteWork" class="badge badge-success badge-sm">
              {{ t("studiosIndex.card.remoteBadge") }}
            </span>
          </div>

          <div class="card-actions justify-end mt-1">
            <button
              class="btn btn-ghost btn-sm"
              :aria-label="t('studiosIndex.card.previewAria', { studio: studio.name })"
              @click="$emit('preview', studio.id)"
            >
              {{ t("studiosIndex.card.previewButton") }}
            </button>
            <button
              class="btn btn-primary btn-sm"
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
        class="btn btn-outline"
        :aria-label="t('studiosIndex.list.loadMoreAria')"
        @click="$emit('loadMore')"
      >
        {{ t("studiosIndex.list.loadMoreButton") }}
      </button>
    </div>
  </div>
</template>
