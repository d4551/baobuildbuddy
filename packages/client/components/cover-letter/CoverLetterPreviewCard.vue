<script setup lang="ts">
defineProps<{
  contentText: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.preview.title") }}</h2>
      <div class="rounded-lg border border-base-300 bg-base-100 p-6 shadow-inner">
        <div v-if="contentText.trim().length > 0" class="whitespace-pre-wrap text-sm leading-relaxed">
          {{ contentText }}
        </div>
        <p v-else class="text-sm text-base-content/60">{{ t("coverLetterDetailPage.preview.empty") }}</p>
      </div>
    </div>
  </section>
</template>
