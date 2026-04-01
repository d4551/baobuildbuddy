<script setup lang="ts">
defineProps<{
  typeOptions: ReadonlyArray<{ value: string; label: string }>;
  statusOptions: ReadonlyArray<{ value: string; label: string }>;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const typeFilter = defineModel<string>("typeFilter", { required: true });
const statusFilter = defineModel<string>("statusFilter", { required: true });
</script>

<template>
  <SectionGrid grid-token="twoColumn">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("automation.runs.typeLabel") }}</legend>
      <select v-model="typeFilter" class="select" :aria-label="t('automation.runs.typeFilterAria')">
        <option value="">{{ t("automation.runs.allTypes") }}</option>
        <option v-for="option in typeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </fieldset>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("automation.runs.statusLabel") }}</legend>
      <select
        v-model="statusFilter"
        class="select"
        :aria-label="t('automation.runs.statusFilterAria')"
      >
        <option value="">{{ t("automation.runs.allStatuses") }}</option>
        <option v-for="option in statusOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </fieldset>
  </SectionGrid>
</template>
