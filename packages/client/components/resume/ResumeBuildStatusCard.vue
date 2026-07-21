<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { HEIGHT_48_CLASS, MARGIN_TOKEN_CLASS } from "~/constants/layout";

defineProps<{
  loadingLabel: string;
}>();

const { t } = useI18n();
</script>


<template>
  <UiGlassCard>
    <div class="card-body items-center justify-center" :class="[HEIGHT_48_CLASS]">
      <LoadingSpinner size="lg" :label="t('common.loading')" class="text-primary" />
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt4]">{{ loadingLabel }}</p>
    </div>
  </UiGlassCard>
</template>
