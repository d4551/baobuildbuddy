<script setup lang="ts">
import type { CoverLetterData } from "@navi/shared";
import { getErrorMessage } from "~/utils/errors";

const route = useRoute();
const router = useRouter();
const { getCoverLetter, updateCoverLetter, generateCoverLetter, loading } = useCoverLetter();
const { $toast } = useNuxtApp();

const letter = ref<CoverLetterData | null>(null);
const letterId = computed(() => route.params.id as string);
const regenerating = ref(false);

const formData = reactive({
  company: "",
  position: "",
  template: "professional",
  content: "",
});

onMounted(async () => {
  letter.value = await getCoverLetter(letterId.value);
  if (letter.value) {
    formData.company = letter.value.company || "";
    formData.position = letter.value.position || "";
    formData.template = letter.value.template || "professional";
    formData.content = letter.value.content || "";
  }
});

async function handleSave() {
  try {
    await updateCoverLetter(letterId.value, formData);
    $toast.success("Cover letter saved");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to save cover letter"));
  }
}

async function handleRegenerate() {
  if (!confirm("This will replace your current content. Continue?")) return;

  regenerating.value = true;
  try {
    const regenerated = await generateCoverLetter({
      company: formData.company,
      position: formData.position,
      template: formData.template,
    });
    if (regenerated?.content) {
      formData.content = regenerated.content;
      $toast.success("Cover letter regenerated");
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to regenerate cover letter"));
  } finally {
    regenerating.value = false;
  }
}

async function handleExport() {
  try {
    const blob = new Blob([formData.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.company}_${formData.position}_CoverLetter.txt`;
    a.click();
    URL.revokeObjectURL(url);
    $toast.success("Cover letter exported");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to export cover letter"));
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <button class="btn btn-ghost btn-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Cover Letters
      </button>

      <div class="flex gap-2">
        <button
          class="btn btn-sm btn-outline"
          :disabled="regenerating"
          @click="handleRegenerate"
        >
          <span v-if="regenerating" class="loading loading-spinner loading-xs"></span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          AI Regenerate
        </button>
        <button class="btn btn-sm btn-outline" @click="handleExport">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
        <button class="btn btn-sm btn-primary" @click="handleSave">
          Save
        </button>
      </div>
    </div>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else class="space-y-6">
      <!-- Header Info -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Cover Letter Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Company</legend>
              <input
                v-model="formData.company"
                type="text"
                class="input w-full"
                placeholder="Company Name"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Position</legend>
              <input
                v-model="formData.position"
                type="text"
                class="input w-full"
                placeholder="Job Title"
              />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Template Style</legend>
              <select v-model="formData.template" class="select w-full">
                <option value="professional">Professional</option>
                <option value="creative">Creative</option>
                <option value="passionate">Passionate</option>
                <option value="technical">Technical</option>
              </select>
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Editor -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Cover Letter Content</h2>

          <div class="alert alert-info mb-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">
              Edit the generated content below. Use the AI Regenerate button to create a new version with the same details.
            </span>
          </div>

          <textarea
            v-model="formData.content"
            class="textarea textarea-bordered w-full font-mono text-sm"
            rows="20"
            placeholder="Your cover letter content will appear here..."
          ></textarea>

          <div class="flex items-center justify-between mt-4">
            <span class="text-sm text-base-content/60">
              {{ formData.content.length }} characters
            </span>
            <div class="flex gap-2">
              <button class="btn btn-sm" @click="formData.content = ''">
                Clear
              </button>
              <button class="btn btn-sm btn-primary" @click="handleSave">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Preview</h2>
          <div class="prose max-w-none">
            <div class="bg-white text-black p-8 rounded-lg shadow-inner">
              <div class="whitespace-pre-wrap">{{ formData.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
