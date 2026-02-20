<script setup lang="ts">
import type { SkillMapping } from "@bao/shared";
import { toSkillMapping } from "~/composables/api-normalizers";
import { getErrorMessage } from "~/utils/errors";

const api = useApi();
const { $toast } = useNuxtApp();

const mappings = ref<SkillMapping[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const categoryFilter = ref("");
const analyzing = ref(false);
const addMappingDialogRef = ref<HTMLDialogElement | null>(null);

const newMapping = reactive({
  gameExpression: "",
  transferableSkill: "",
  industryApplications: [] as string[],
  confidence: 50,
  category: "leadership",
});

const categories = [
  { value: "leadership", label: "Leadership" },
  { value: "teamwork", label: "Teamwork & Collaboration" },
  { value: "problem-solving", label: "Problem Solving" },
  { value: "communication", label: "Communication" },
  { value: "strategy", label: "Strategy & Planning" },
  { value: "technical", label: "Technical Skills" },
  { value: "creativity", label: "Creativity & Design" },
];

onMounted(() => {
  fetchMappings();
});

watch(showAddModal, (isOpen) => {
  const dialog = addMappingDialogRef.value;
  if (!dialog) return;

  if (isOpen && !dialog.open) {
    dialog.showModal();
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

async function fetchMappings() {
  loading.value = true;
  try {
    const { data } = await api.skills.mappings.get();
    mappings.value = Array.isArray(data)
      ? data
          .map((entry) => toSkillMapping(entry))
          .filter((entry): entry is SkillMapping => entry !== null)
      : [];
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to fetch skill mappings"));
  } finally {
    loading.value = false;
  }
}

const filteredMappings = computed(() => {
  if (!categoryFilter.value) return mappings.value;
  return mappings.value.filter((m) => m.category === categoryFilter.value);
});

async function handleAddMapping() {
  if (newMapping.gameExpression.trim().length < 2) {
    $toast.error("Game experience must be at least 2 characters");
    return;
  }

  if (newMapping.transferableSkill.trim().length < 2) {
    $toast.error("Transferable skill must be at least 2 characters");
    return;
  }

  loading.value = true;
  try {
    await api.skills.mappings.post(newMapping);
    await fetchMappings();
    showAddModal.value = false;
    resetForm();
    $toast.success("Skill mapping added");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to add skill mapping"));
  } finally {
    loading.value = false;
  }
}

async function handleDeleteMapping(id: string) {
  if (!confirm("Are you sure you want to delete this mapping?")) return;

  loading.value = true;
  try {
    await api.skills.mappings({ id }).delete();
    await fetchMappings();
    $toast.success("Skill mapping deleted");
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to delete skill mapping"));
  } finally {
    loading.value = false;
  }
}

async function handleAIAnalyze() {
  analyzing.value = true;
  try {
    const { data } = await api.skills["ai-analyze"].post({});
    if (data) {
      await fetchMappings();
      $toast.success("Skills analyzed successfully");
    }
  } catch (error: unknown) {
    $toast.error(getErrorMessage(error, "Failed to analyze skills"));
  } finally {
    analyzing.value = false;
  }
}

function resetForm() {
  newMapping.gameExpression = "";
  newMapping.transferableSkill = "";
  newMapping.industryApplications = [];
  newMapping.confidence = 50;
  newMapping.category = "leadership";
}

const newApplication = ref("");

function addApplication() {
  if (newApplication.value.trim()) {
    newMapping.industryApplications.push(newApplication.value.trim());
    newApplication.value = "";
  }
}

function removeApplication(index: number) {
  newMapping.industryApplications.splice(index, 1);
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Skill Mapper</h1>
      <div class="flex gap-2">
        <button
          class="btn btn-outline btn-sm"
          :disabled="analyzing"
          @click="handleAIAnalyze"
        >
          <span v-if="analyzing" class="loading loading-spinner loading-xs"></span>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Analyze
        </button>
        <button class="btn btn-primary btn-sm" @click="showAddModal = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Mapping
        </button>
      </div>
    </div>

    <div class="card bg-base-200 mb-6">
      <div class="card-body">
        <p class="text-base-content/70">
          Map your gaming experiences to professional skills valued in the game industry.
          Show employers how your gaming background translates to real-world competencies.
        </p>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="tabs tabs-boxed mb-6">
      <button
        class="tab"
        :class="{ 'tab-active': categoryFilter === '' }"
        @click="categoryFilter = ''"
      >
        All
      </button>
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="tab"
        :class="{ 'tab-active': categoryFilter === cat.value }"
        @click="categoryFilter = cat.value"
      >
        {{ cat.label }}
      </button>
    </div>

    <LoadingSkeleton v-if="loading && !mappings.length" :lines="6" />

    <div v-else-if="filteredMappings.length === 0" class="alert">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>No skill mappings found. Add your first mapping to get started.</span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Gaming Experience</th>
            <th>Transferable Skill</th>
            <th>Industry Applications</th>
            <th>Confidence</th>
            <th>Category</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mapping in filteredMappings" :key="mapping.id">
            <td class="font-medium">{{ mapping.gameExpression }}</td>
            <td>{{ mapping.transferableSkill }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="(app, idx) in (mapping.industryApplications || []).slice(0, 2)"
                  :key="idx"
                  class="badge badge-sm"
                >
                  {{ app }}
                </span>
                <span
                  v-if="(mapping.industryApplications || []).length > 2"
                  class="badge badge-sm"
                >
                  +{{ (mapping.industryApplications || []).length - 2 }}
                </span>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <progress
                  class="progress progress-primary w-20"
                  :value="mapping.confidence"
                  max="100"
                  aria-label="Confidence progress"></progress>
                <span class="text-xs">{{ mapping.confidence }}%</span>
              </div>
            </td>
            <td>
              <span class="badge badge-outline badge-sm">
                {{ categories.find(c => c.value === mapping.category)?.label || mapping.category }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-ghost btn-xs btn-error"
                @click="handleDeleteMapping(mapping.id)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Mapping Modal -->
    <dialog ref="addMappingDialogRef" class="modal" @close="showAddModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">Add Skill Mapping</h3>

        <div class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Gaming Experience</legend>
            <input
              v-model="newMapping.gameExpression"
              type="text"
              placeholder="e.g. Led 40-person raid guild to world-first clear"
              class="input w-full"
              aria-label="e.g. Led 40-person raid guild to world-first clear"/>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Transferable Skill</legend>
            <input
              v-model="newMapping.transferableSkill"
              type="text"
              placeholder="e.g. Team Leadership & Coordination"
              class="input w-full"
              aria-label="e.g. Team Leadership & Coordination"/>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Category</legend>
            <select v-model="newMapping.category" class="select w-full" aria-label="Category">
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </fieldset>

          <div>
            <div class="fieldset-legend mb-2 block">Industry Applications</div>
            <div class="flex gap-2 mb-2">
              <input
                v-model="newApplication"
                type="text"
                placeholder="e.g. Project Management"
                class="input input-sm flex-1"
                @keyup.enter="addApplication"
                aria-label="e.g. Project Management"/>
              <button class="btn btn-sm btn-primary" @click="addApplication">
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(app, idx) in newMapping.industryApplications"
                :key="idx"
                class="badge gap-2"
              >
                {{ app }}
                <button class="btn btn-ghost btn-xs btn-circle" @click="removeApplication(idx)">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Confidence Level: {{ newMapping.confidence }}%</legend>
            <input
              v-model.number="newMapping.confidence"
              type="range"
              min="0"
              max="100"
              class="range range-primary"
              aria-label="Confidence"/>
          </fieldset>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            @click="showAddModal = false"
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="!newMapping.gameExpression || !newMapping.transferableSkill"
            @click="handleAddMapping"
          >
            Add Mapping
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAddModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
