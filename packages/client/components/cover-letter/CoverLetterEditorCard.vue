<script setup lang="ts">
defineProps<{
  contentCharacterCount: number;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const contentText = defineModel<string>("contentText", { required: true });

const emit = defineEmits<{
  clear: [];
  save: [];
}>();
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.editor.title") }}</h2>

      <div class="alert alert-info alert-soft" role="status">
        <IconInfoCircle class="h-5 w-5" />
        <span>{{ t("coverLetterDetailPage.editor.info") }}</span>
      </div>

      <textarea
        v-model="contentText"
        class="textarea w-full font-mono text-sm"
        rows="20"
        :placeholder="t('coverLetterDetailPage.editor.placeholder')"
        :aria-label="t('coverLetterDetailPage.editor.aria')"
      ></textarea>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-base-content/60">
          {{ t("coverLetterDetailPage.editor.characterCount", { count: contentCharacterCount }) }}
        </span>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-ghost" :aria-label="t('coverLetterDetailPage.editor.clearAria')" @click="emit('clear')">
            {{ t("coverLetterDetailPage.editor.clearButton") }}
          </button>
          <button class="btn btn-sm btn-primary" :aria-label="t('coverLetterDetailPage.editor.saveAria')" @click="emit('save')">
            {{ t("coverLetterDetailPage.editor.saveButton") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
