<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  screenshotPaths: readonly string[];
  screenshotEndpoint: (index: number) => string;
  screenshotLinkLabel: (index: number) => string;
  screenshotHasError: (index: number) => boolean;
  markScreenshotError: (index: number) => void;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.screenshotsTitle')">
    <div class="card-body">
      <h2 class="card-title">{{ t("automation.runDetail.screenshotsTitle") }}</h2>
      <div v-if="screenshotPaths.length === 0" class="text-sm text-muted">
        {{ t("automation.runDetail.noScreenshots") }}
      </div>
      <SectionGrid v-else grid-token="threeColumn">
        <article
          v-for="(screenshotPath, index) in screenshotPaths"
          :key="screenshotPath"
          class="card bg-base-200"
        >
          <figure class="px-4 pt-4">
            <img
              v-if="!screenshotHasError(index)"
              :src="screenshotEndpoint(index)"
              class="rounded-lg"
              :alt="t('automation.runDetail.screenshotAlt', { index: index + 1 })"
              @error="markScreenshotError(index)"
            />
            <div
              v-else
              class="w-full rounded-lg border border-dashed border-base-content/30 p-4 text-sm text-secondary"
              role="status"
            >
              {{ t("automation.runDetail.screenshotLoadError", { index: index + 1 }) }}
            </div>
          </figure>
          <div class="card-body px-4 py-3">
            <a
              class="link link-primary text-sm"
              :href="screenshotEndpoint(index)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="screenshotLinkLabel(index)"
            >
              {{ screenshotLinkLabel(index) }}
            </a>
          </div>
        </article>
      </SectionGrid>
    </div>
  </section>
</template>
