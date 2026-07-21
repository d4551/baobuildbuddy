<script setup lang="ts">
import type { ComposerTranslation } from "vue-i18n";
import {
  LEADING_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  contentText: string;
  t: ComposerTranslation;
}>();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.preview.title") }}</h2>
      <div class="border border-base-300 bg-base-100" :class="[SHADOW_TOKEN_CLASS.inner, RADIUS_TOKEN_CLASS.lg, PADDING_TOKEN_CLASS.p6]">
        <div v-if="contentText.trim().length > 0" class="whitespace-pre-wrap" :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]">
          {{ contentText }}
        </div>
        <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("coverLetterDetailPage.preview.empty") }}</p>
      </div>
    </div>
  </UiGlassCard>
</template>
