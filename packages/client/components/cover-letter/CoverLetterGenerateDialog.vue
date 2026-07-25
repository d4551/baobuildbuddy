<script setup lang="ts">
import type { CoverLetterTemplate } from "@bao/shared/constants/cover-letter";
import type { ResumeData } from "@bao/shared/types/resume";
import type { CoverLetterGenerateForm } from "~/composables/useCoverLetterListPage";
import AppProseField from "~/components/ui/AppProseField.vue";
import {
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const open = defineModel<boolean>("open", { default: false });
const form = defineModel<CoverLetterGenerateForm>("form", { required: true });

defineProps<{
  generating: boolean;
  titleId: string;
  companyMinLength: number;
  positionMinLength: number;
  jobDescriptionMinLength: number;
  resumes: ResumeData[];
  templateOptions: readonly CoverLetterTemplate[];
  templateLabel: (template: CoverLetterTemplate) => string;
}>();

defineEmits<{
  generate: [];
}>();
</script>

<template>
  <AppModalFrame
    v-model:open="open"
    :title-id="titleId"
    size-token="compact"
    :close-aria-label="$t('coverLetterPage.generate.closeBackdropAria')"
    :close-backdrop-label="$t('coverLetterPage.generate.closeBackdropButton')"
  >
    <h2 :id="titleId" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">
      {{ $t("coverLetterPage.generate.title") }}
    </h2>
    <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">
      {{ $t("coverLetterPage.generate.subtitle") }}
    </p>

    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4, MARGIN_TOKEN_CLASS.mt4]">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("coverLetterPage.generate.companyLegend") }}
        </legend>
        <input 
          v-model="form.company"
          type="text"
          :minlength="companyMinLength"
          required
          class="input validator" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="$t('coverLetterPage.generate.companyPlaceholder')"
          :aria-label="$t('coverLetterPage.generate.companyAria')"
        />
        <p class="validator-hint">
          {{ $t("coverLetterPage.generate.companyHint", { count: companyMinLength }) }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("coverLetterPage.generate.positionLegend") }}
        </legend>
        <input 
          v-model="form.position"
          type="text"
          :minlength="positionMinLength"
          required
          class="input validator" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="$t('coverLetterPage.generate.positionPlaceholder')"
          :aria-label="$t('coverLetterPage.generate.positionAria')"
        />
        <p class="validator-hint">
          {{ $t("coverLetterPage.generate.positionHint", { count: positionMinLength }) }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("coverLetterPage.generate.resumeLegend") }}
        </legend>
        <select 
          v-model="form.resumeId"
          class="select" :class="[FLUID_WIDTH_CLASS]"
          :aria-label="$t('coverLetterPage.generate.resumeAria')"
        >
          <option value="">
            {{ $t("coverLetterPage.generate.resumeNoneOption") }}
          </option>
          <option v-for="resume in resumes" :key="resume.id" :value="resume.id">
            {{ resume.name }}
          </option>
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("coverLetterPage.generate.jobDescriptionLegend") }}
        </legend>
        <AppProseField
          v-model="form.jobDescription"
          :placeholder="$t('coverLetterPage.generate.jobDescriptionPlaceholder')"
          :aria-label="$t('coverLetterPage.generate.jobDescriptionAria')"
        />
        <p class="validator-hint">
          {{ $t("coverLetterPage.generate.jobDescriptionHint", { count: jobDescriptionMinLength }) }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          {{ $t("coverLetterPage.generate.templateLegend") }}
        </legend>
        <select 
          v-model="form.template"
          class="select" :class="[FLUID_WIDTH_CLASS]"
          :aria-label="$t('coverLetterPage.generate.templateAria')"
        >
          <option v-for="template in templateOptions" :key="template" :value="template">
            {{ templateLabel(template) }}
          </option>
        </select>
      </fieldset>
    </div>

    <div class="modal-action">
      <button 
        class="btn btn-ghost"
        :aria-label="$t('coverLetterPage.generate.cancelAria')"
        @click="open = false"
      >
        {{ $t("coverLetterPage.generate.cancelButton") }}
      </button>
      <button 
        :class="[PRIMARY_ACTION_CLASS]"
        :disabled="generating || !form.company || !form.position"
        :aria-label="$t('coverLetterPage.generate.submitAria')"
        @click="$emit('generate')"
      >
        <LoadingSpinner v-if="generating" size="xs" :label="$t('coverLetterPage.generate.submitButton')" />
        <IconBolt :class="[ICON_SIZE_CLASS[4]]" v-else/>
        {{ $t("coverLetterPage.generate.submitButton") }}
      </button>
    </div>
  </AppModalFrame>
</template>
