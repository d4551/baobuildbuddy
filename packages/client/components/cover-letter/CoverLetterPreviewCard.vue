<script setup lang="ts">
import { SHADOW_TOKEN_CLASS, RADIUS_TOKEN_CLASS } from "~/constants/layout";
defineProps<{
  contentText: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.preview.title") }}</h2>
      <div class="border border-base-300 bg-base-100 p-6" :class="[SHADOW_TOKEN_CLASS.inner, RADIUS_TOKEN_CLASS.lg]">
        <div v-if="contentText.trim().length > 0" class="whitespace-pre-wrap text-sm leading-relaxed">
          {{ contentText }}
        </div>
        <p v-else class="text-sm text-muted">{{ t("coverLetterDetailPage.preview.empty") }}</p>
      </div>
    </div>
  </section>
</template>
