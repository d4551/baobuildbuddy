<script setup lang="ts">
import {
  LEADING_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  RADIUS_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  contentText: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <section :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.preview.title") }}</h2>
 <div class="border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p6, SHADOW_TOKEN_CLASS.inner, RADIUS_TOKEN_CLASS.lg]">
 <div v-if="contentText.trim().length :class="[LEADING_TOKEN_CLASS.relaxed, TYPOGRAPHY_SCALE_CLASS.sm]"> 0" class="whitespace-pre-wrap" >
          {{ contentText }}
        </div>
        <p v-else class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("coverLetterDetailPage.preview.empty") }}</p>
      </div>
    </div>
  </section>
</template>
