<script setup lang="ts">
import type { AutomationRun } from "~/composables/useAutomation";
import { getErrorMessage } from "~/utils/errors";

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

async function submitJobApply() {
  submitError.value = "";
  lastRun.value = null;
  pending.value = true;
  try {
    const body = {
      jobUrl: form.jobUrl.trim(),
      resumeId: form.resumeId,
      coverLetterId: form.coverLetterId || undefined,
      jobId: form.jobId || undefined,
    };
    const result = await triggerJobApply(body);
    lastRun.value = {
      id: result.runId,
      type: "job_apply",
      status: result.status,
      jobId: body.jobId || null,
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
  } catch (error: unknown) {
    submitError.value = getErrorMessage(error, "Failed to start job application automation");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Job Application Automation</h1>

    <div class="card bg-base-100 shadow-sm max-w-3xl">
      <div class="card-body">
        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Job URL</legend>
            <input
              v-model="form.jobUrl"
              type="url"
              class="input input-bordered w-full"
              placeholder="https://example.com/jobs/123"
              aria-label="https://example.com/jobs/123"/>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Resume</legend>
            <select v-model="form.resumeId" class="select select-bordered w-full" aria-label="Resume Id">
              <option value="" disabled>Select resume</option>
              <option v-for="resume in resumesData || []" :key="resume.id" :value="resume.id">
                {{ resume.name || `Resume ${resume.id}` }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Cover Letter (optional)</legend>
            <select v-model="form.coverLetterId" class="select select-bordered w-full" aria-label="Cover Letter Id">
              <option value="">No cover letter</option>
              <option v-for="letter in coverLettersData || []" :key="letter.id" :value="letter.id">
                {{ letter.company || "Unknown" }} - {{ letter.position || "Position" }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Job ID (optional)</legend>
            <input
              v-model="form.jobId"
              class="input input-bordered w-full"
              placeholder="Optional job ID for correlation"
              aria-label="Optional job ID for correlation"/>
          </fieldset>
        </div>

        <div class="mt-6">
          <button
            class="btn btn-primary"
            :disabled="pending || !form.jobUrl || !form.resumeId"
            @click="submitJobApply"
          >
            <span v-if="pending" class="loading loading-spinner loading-sm"></span>
            <span v-else>Run Application</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="submitError" role="alert" class="alert alert-error mt-6">
      <h3 class="font-semibold">Submission failed</h3>
      <p>{{ submitError }}</p>
    </div>

    <div v-if="lastRun" class="card bg-base-100 shadow-sm mt-6">
      <div class="card-body">
        <div role="alert" class="alert alert-info">
          <h3 class="font-semibold">Run started</h3>
          <div>
            <p class="mb-1">Run ID: {{ lastRun.id }}</p>
            <p class="text-sm">Status: {{ lastRun.status }}</p>
            <NuxtLink
              :to="`/automation/runs/${encodeURIComponent(lastRun.id)}`"
              class="link link-primary link-hover"
            >
              Open run detail
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
