<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

const studiosFetch = useFetch("/api/scraper/studios", {
  method: "POST",
  immediate: false,
});

const jobsFetch = useFetch("/api/scraper/jobs/gamedev", {
  method: "POST",
  immediate: false,
});

const studioState = ref<"idle" | "running" | "success" | "error">("idle");
const jobState = ref<"idle" | "running" | "success" | "error">("idle");
const studioMessage = ref<string>("");
const jobMessage = ref<string>("");

async function runStudios() {
  studioState.value = "running";
  studioMessage.value = "";
  await studiosFetch.refresh();
  if (studiosFetch.error.value) {
    studioState.value = "error";
    studioMessage.value = getErrorMessage(studiosFetch.error.value, "Studio scraper failed");
    return;
  }
  studioState.value = "success";
  studioMessage.value = "Studio scrape completed. Results ingested.";
}

async function runJobs() {
  jobState.value = "running";
  jobMessage.value = "";
  await jobsFetch.refresh();
  if (jobsFetch.error.value) {
    jobState.value = "error";
    jobMessage.value = getErrorMessage(jobsFetch.error.value, "Job scraper failed");
    return;
  }
  jobState.value = "success";
  jobMessage.value = "Job scrape completed. Results ingested.";
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Automation Scraper</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card bg-base-100 card-side shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Scrape Studios</h2>
          <p class="mb-4">
            Run the studio scraper against external sources and refresh studio directory records.
          </p>
          <div class="card-actions">
            <button class="btn btn-primary" :disabled="studioState === 'running'" @click="runStudios">
              <span v-if="studioState === 'running'" class="loading loading-spinner"></span>
              <span v-else>Run Studio Scraper</span>
            </button>
          </div>
          <div v-if="studioState !== 'idle'" class="mt-4">
            <div
              v-if="studioState === 'success'"
              role="alert"
              class="alert alert-success"
            >
              <h3 class="font-semibold">Completed</h3>
              <p>{{ studioMessage }}</p>
            </div>
            <div
              v-else-if="studioState === 'error'"
              role="alert"
              class="alert alert-error"
            >
              <h3 class="font-semibold">Failed</h3>
              <p>{{ studioMessage }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 card-side shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Scrape GameDev Jobs</h2>
          <p class="mb-4">
            Pull the latest job data and upsert into the job feed for recommendations.
          </p>
          <div class="card-actions">
            <button class="btn btn-primary" :disabled="jobState === 'running'" @click="runJobs">
              <span v-if="jobState === 'running'" class="loading loading-spinner"></span>
              <span v-else>Run Job Scraper</span>
            </button>
          </div>
          <div v-if="jobState !== 'idle'" class="mt-4">
            <div v-if="jobState === 'success'" role="alert" class="alert alert-success">
              <h3 class="font-semibold">Completed</h3>
              <p>{{ jobMessage }}</p>
            </div>
            <div v-else-if="jobState === 'error'" role="alert" class="alert alert-error">
              <h3 class="font-semibold">Failed</h3>
              <p>{{ jobMessage }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
