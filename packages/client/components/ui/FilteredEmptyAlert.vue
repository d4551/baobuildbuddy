<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  messageKey: string;
  iconClass?: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="alert alert-soft" role="status">
    <IconXCircle :class="iconClass ?? 'h-6 w-6'" />
    <span>{{ t(messageKey) }}</span>
  </div>
</template>
