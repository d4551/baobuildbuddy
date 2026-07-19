<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
} from "~/constants/layout";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";

defineProps<{
  coverLetters: CoverLetterSelectOption[];
  isScheduleDisabled: boolean;
  isSubmitDisabled: boolean;
  pending: boolean;
  resumes: ResumeSelectOption[];
}>();

defineEmits<{
  schedule: [];
  submit: [];
}>();

const jobUrl = defineModel<string>("jobUrl", { required: true });
const resumeId = defineModel<string>("resumeId", { required: true });
const coverLetterId = defineModel<string>("coverLetterId", { required: true });
const jobId = defineModel<string>("jobId", { required: true });
const runAt = defineModel<string>("runAt", { required: true });

const { t } = useI18n();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body">
      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("automation.jobApply.jobUrlLegend") }}</legend>
          <input
            v-model="jobUrl"
            type="url"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('automation.jobApply.jobUrlPlaceholder')"
            :aria-label="t('automation.jobApply.jobUrlAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("automation.jobApply.resumeLegend") }}</legend>
          <select
            v-model="resumeId"
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('automation.jobApply.resumeAria')"
          >
            <option value="" disabled>{{ t("automation.jobApply.selectResumeOption") }}</option>
            <option v-for="resume in resumes" :key="resume.id" :value="resume.id">
              {{ resume.name || t("automation.jobApply.resumeFallbackName", { id: resume.id }) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("automation.jobApply.coverLetterLegend") }}</legend>
          <select
            v-model="coverLetterId"
            class="select" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('automation.jobApply.coverLetterAria')"
          >
            <option value="">{{ t("automation.jobApply.noCoverLetterOption") }}</option>
            <option v-for="letter in coverLetters" :key="letter.id" :value="letter.id">
              {{
                t("automation.jobApply.coverLetterOption", {
                  company: letter.company || t("automation.jobApply.unknownCompany"),
                  position: letter.position || t("automation.jobApply.unknownPosition"),
                })
              }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("automation.jobApply.jobIdLegend") }}</legend>
          <input
            v-model="jobId"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('automation.jobApply.jobIdPlaceholder')"
            :aria-label="t('automation.jobApply.jobIdAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("automation.jobApply.schedule.legend") }}</legend>
          <input
            v-model="runAt"
            type="datetime-local"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('automation.jobApply.schedule.aria')"
          />
          <p class="validator-hint">{{ t("automation.jobApply.schedule.hint") }}</p>
        </fieldset>
      </div>

      <div class="join" :class="[MARGIN_TOKEN_CLASS.mt6]">
        <button
          class="btn btn-primary join-item"
          :disabled="isSubmitDisabled"
          :aria-label="t('automation.jobApply.runButtonAria')"
          @click="$emit('submit')"
        >
          <LoadingSpinner size="sm" label="Loading" v-if="pending" />
          <span v-else>{{ t("automation.jobApply.runButton") }}</span>
        </button>
        <button
          class="btn btn-outline join-item"
          :disabled="isScheduleDisabled"
          :aria-label="t('automation.jobApply.schedule.buttonAria')"
          @click="$emit('schedule')"
        >
          <LoadingSpinner size="sm" label="Loading" v-if="pending" />
          <span v-else>{{ t("automation.jobApply.schedule.button") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
