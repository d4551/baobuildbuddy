<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SURFACE_GLASS_CARD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";

defineProps<{
  formattedInput: string;
  formattedOutput: string;
}>();

const { t } = useI18n();
</script>

<template>
  <SectionGrid grid-token="twoColumnWide">
    <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('automation.runDetail.inputPayloadTitle')">
      <div class="card-body">
        <h2 class="card-title">{{ t("automation.runDetail.inputPayloadTitle") }}</h2>
        <pre class="whitespace-pre-wrap" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ formattedInput }}</pre>
      </div>
    </section>
    <section :class="SURFACE_GLASS_CARD_CLASS" :aria-label="t('automation.runDetail.outputPayloadTitle')">
      <div class="card-body">
        <h2 class="card-title">{{ t("automation.runDetail.outputPayloadTitle") }}</h2>
        <pre class="whitespace-pre-wrap" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ formattedOutput }}</pre>
      </div>
    </section>
  </SectionGrid>
</template>
