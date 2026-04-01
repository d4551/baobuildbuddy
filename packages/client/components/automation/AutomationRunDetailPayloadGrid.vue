<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  formattedInput: string;
  formattedOutput: string;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.inputPayloadTitle')">
      <div class="card-body">
        <h2 class="card-title">{{ t("automation.runDetail.inputPayloadTitle") }}</h2>
        <pre class="text-sm whitespace-pre-wrap">{{ formattedInput }}</pre>
      </div>
    </section>
    <section class="card bg-base-100 shadow-sm" :aria-label="t('automation.runDetail.outputPayloadTitle')">
      <div class="card-body">
        <h2 class="card-title">{{ t("automation.runDetail.outputPayloadTitle") }}</h2>
        <pre class="text-sm whitespace-pre-wrap">{{ formattedOutput }}</pre>
      </div>
    </section>
  </SectionGrid>
</template>
