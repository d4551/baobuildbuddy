<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { AutomationRun } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();
const { triggerJobApply } = useAutomation();
const requestUrl = useRequestURL();
const apiBase = String(useRuntimeConfig().public.apiBase || "/");
const resolvedApiBase = new URL(apiBase, requestUrl).toString().replace(/\/$/, "");
const baseIsApi = /\/api\/?$/i.test(new URL(resolvedApiBase).pathname);
const resolveEndpoint = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return baseIsApi && normalizedPath.startsWith("/api/")
    ? `${resolvedApiBase}${normalizedPath.replace(/^\/api/, "")}`
    : `${resolvedApiBase}${normalizedPath}`;
};

interface FormState {
  jobUrl: string;
  resumeId: string;
  coverLetterId: string;
  jobId: string;
}

const { data: resumesData } = await useFetch<{ id: string; name?: string }[]>(
  resolveEndpoint("/api/resumes"),
  {
    method: "GET",
  },
);

const { data: coverLettersData } = await useFetch<
  { id: string; company?: string; position?: string }[]
>(resolveEndpoint("/api/cover-letters"), { method: "GET" });

const form = reactive<FormState>({
  jobUrl: "",
  resumeId: "",
  coverLetterId: "",
  jobId: "",
});

const pending = ref(false);
const submitError = ref("");
const lastRun = ref<AutomationRun | null>(null);

async function submitJobApply(): Promise<void> {
  submitError.value = "";
  lastRun.value = null;
  pending.value = true;
  try {
    const coverLetterId = form.coverLetterId.trim();
    const jobId = form.jobId.trim();
    const body = {
      jobUrl: form.jobUrl.trim(),
      resumeId: form.resumeId,
      ...(coverLetterId ? { coverLetterId } : {}),
      ...(jobId ? { jobId } : {}),
    };

    const result = await triggerJobApply(body);
    lastRun.value = {
      id: result.runId,
      type: "job_apply",
      status: result.status,
      jobId: jobId || null,
      userId: null,
      input: body,
      output: null,
      screenshots: [],
      error: null,
      progress: 0,
      currentStep: null,
      totalSteps: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    submitError.value = getErrorMessage(error, t("automation.jobApply.submitErrorFallback"));
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">{{ t("automation.jobApply.title") }}</h1>

    <div class="card bg-base-100 max-w-3xl shadow-sm">
      <div class="card-body">
        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.jobUrlLegend") }}</legend>
            <input
              v-model="form.jobUrl"
              type="url"
              class="input input-bordered w-full"
              :placeholder="t('automation.jobApply.jobUrlPlaceholder')"
              :aria-label="t('automation.jobApply.jobUrlAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.resumeLegend") }}</legend>
            <select
              v-model="form.resumeId"
              class="select select-bordered w-full"
              :aria-label="t('automation.jobApply.resumeAria')"
            >
              <option value="" disabled>{{ t("automation.jobApply.selectResumeOption") }}</option>
              <option v-for="resume in resumesData || []" :key="resume.id" :value="resume.id">
                {{ resume.name || t("automation.jobApply.resumeFallbackName", { id: resume.id }) }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("automation.jobApply.coverLetterLegend") }}</legend>
            <select
              v-model="form.coverLetterId"
              class="select select-bordered w-full"
              :aria-label="t('automation.jobApply.coverLetterAria')"
            >
              <option value="">{{ t("automation.jobApply.noCoverLetterOption") }}</option>
              <option v-for="letter in coverLettersData || []" :key="letter.id" :value="letter.id">
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
              v-model="form.jobId"
              class="input input-bordered w-full"
              :placeholder="t('automation.jobApply.jobIdPlaceholder')"
              :aria-label="t('automation.jobApply.jobIdAria')"
            />
          </fieldset>
        </div>

        <div class="mt-6">
          <button
            class="btn btn-primary"
            :disabled="pending || !form.jobUrl || !form.resumeId"
            :aria-label="t('automation.jobApply.runButtonAria')"
            @click="submitJobApply"
          >
            <span v-if="pending" class="loading loading-spinner loading-sm"></span>
            <span v-else>{{ t("automation.jobApply.runButton") }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitError" role="alert" class="alert alert-error mt-6">
      <h3 class="font-semibold">{{ t("automation.jobApply.submitErrorTitle") }}</h3>
      <p>{{ submitError }}</p>
    </div>

    <div v-if="lastRun" class="card bg-base-100 shadow-sm mt-6">
      <div class="card-body">
        <div role="alert" class="alert alert-info">
          <h3 class="font-semibold">{{ t("automation.jobApply.runStartedTitle") }}</h3>
          <div>
            <p class="mb-1">{{ t("automation.jobApply.runIdLabel", { id: lastRun.id }) }}</p>
            <p class="text-sm">{{ t("automation.jobApply.statusLabel", { status: lastRun.status }) }}</p>
            <NuxtLink
              :to="`/automation/runs/${encodeURIComponent(lastRun.id)}`"
              class="link link-primary link-hover"
              :aria-label="t('automation.jobApply.openRunDetailAria', { id: lastRun.id })"
            >
              {{ t("automation.jobApply.openRunDetailLink") }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
