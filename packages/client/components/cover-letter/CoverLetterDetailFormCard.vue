<script setup lang="ts">
import {
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_POSITION_MIN_LENGTH,
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterTemplate,
} from "@bao/shared/constants/cover-letter";
import SectionGrid from "~/components/ui/SectionGrid.vue";

defineProps<{
  templateLabel: (template: CoverLetterTemplate) => string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const formData = defineModel<{
  company: string;
  position: string;
  template: CoverLetterTemplate;
  contentText: string;
}>("formData", { required: true });
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("coverLetterDetailPage.details.title") }}</h2>
      <SectionGrid grid-token="threeColumnMd">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.companyLegend") }}</legend>
          <input
            v-model="formData.company"
            type="text"
            :minlength="COVER_LETTER_COMPANY_MIN_LENGTH"
            class="input validator w-full"
            :placeholder="t('coverLetterDetailPage.details.companyPlaceholder')"
            :aria-label="t('coverLetterDetailPage.details.companyAria')"
          />
          <p class="validator-hint">
            {{ t("coverLetterDetailPage.details.companyHint", { count: COVER_LETTER_COMPANY_MIN_LENGTH }) }}
          </p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.positionLegend") }}</legend>
          <input
            v-model="formData.position"
            type="text"
            :minlength="COVER_LETTER_POSITION_MIN_LENGTH"
            class="input validator w-full"
            :placeholder="t('coverLetterDetailPage.details.positionPlaceholder')"
            :aria-label="t('coverLetterDetailPage.details.positionAria')"
          />
          <p class="validator-hint">
            {{ t("coverLetterDetailPage.details.positionHint", { count: COVER_LETTER_POSITION_MIN_LENGTH }) }}
          </p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("coverLetterDetailPage.details.templateLegend") }}</legend>
          <select
            v-model="formData.template"
            class="select w-full"
            :aria-label="t('coverLetterDetailPage.details.templateAria')"
          >
            <option v-for="template in COVER_LETTER_TEMPLATE_OPTIONS" :key="template" :value="template">
              {{ templateLabel(template) }}
            </option>
          </select>
        </fieldset>
      </SectionGrid>
    </div>
  </section>
</template>
