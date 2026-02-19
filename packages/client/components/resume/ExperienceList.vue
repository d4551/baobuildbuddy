<script setup lang="ts">
interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description: string;
  highlights: string[];
}

const props = defineProps<{
  modelValue: ExperienceItem[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ExperienceItem[]];
}>();

const localValue = ref<ExperienceItem[]>([...props.modelValue]);
const editingId = ref<string | null>(null);
const newHighlight = ref<Record<string, string>>({});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = [...newValue];
  },
  { deep: true },
);

function updateValue() {
  emit("update:modelValue", [...localValue.value]);
}

function addItem() {
  const newItem: ExperienceItem = {
    id: Date.now().toString(),
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    description: "",
    highlights: [],
  };
  localValue.value.push(newItem);
  editingId.value = newItem.id;
  updateValue();
}

function removeItem(id: string) {
  localValue.value = localValue.value.filter((item) => item.id !== id);
  updateValue();
}

function toggleEdit(id: string) {
  editingId.value = editingId.value === id ? null : id;
}

function addHighlight(itemId: string) {
  const highlight = newHighlight.value[itemId]?.trim();
  if (!highlight) return;

  const item = localValue.value.find((i) => i.id === itemId);
  if (item) {
    item.highlights.push(highlight);
    newHighlight.value[itemId] = "";
    updateValue();
  }
}

function removeHighlight(itemId: string, index: number) {
  const item = localValue.value.find((i) => i.id === itemId);
  if (item) {
    item.highlights.splice(index, 1);
    updateValue();
  }
}

function moveUp(index: number) {
  if (index > 0) {
    const temp = localValue.value[index];
    localValue.value[index] = localValue.value[index - 1];
    localValue.value[index - 1] = temp;
    updateValue();
  }
}

function moveDown(index: number) {
  if (index < localValue.value.length - 1) {
    const temp = localValue.value[index];
    localValue.value[index] = localValue.value[index + 1];
    localValue.value[index + 1] = temp;
    updateValue();
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in localValue"
      :key="item.id"
      class="card bg-base-200"
    >
      <div class="card-body">
        <div class="flex justify-between items-start">
          <h3 class="card-title text-base">
            {{ item.title || 'New Experience' }}
          </h3>
          <div class="flex gap-1">
            <button
              class="btn btn-ghost btn-xs btn-square"
              @click="moveUp(index)"
              :disabled="index === 0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square"
              @click="moveDown(index)"
              :disabled="index === localValue.length - 1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square"
              @click="toggleEdit(item.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square text-error"
              @click="removeItem(item.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="editingId === item.id" class="space-y-3 mt-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label label-text-alt">Company</label>
              <input
                v-model="item.company"
                type="text"
                placeholder="Company Name"
                class="input input-bordered input-sm"
                @input="updateValue"
              />
            </div>
            <div class="form-control">
              <label class="label label-text-alt">Title</label>
              <input
                v-model="item.title"
                type="text"
                placeholder="Job Title"
                class="input input-bordered input-sm"
                @input="updateValue"
              />
            </div>
            <div class="form-control">
              <label class="label label-text-alt">Start Date</label>
              <input
                v-model="item.startDate"
                type="month"
                class="input input-bordered input-sm"
                @input="updateValue"
              />
            </div>
            <div class="form-control">
              <label class="label label-text-alt">End Date</label>
              <input
                v-model="item.endDate"
                type="month"
                placeholder="Present"
                class="input input-bordered input-sm"
                @input="updateValue"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label label-text-alt">Description</label>
            <textarea
              v-model="item.description"
              class="textarea textarea-bordered"
              rows="3"
              placeholder="Brief description of your role..."
              @input="updateValue"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label label-text-alt">Key Highlights</label>
            <div class="space-y-2">
              <div
                v-for="(highlight, hIndex) in item.highlights"
                :key="hIndex"
                class="flex gap-2 items-center"
              >
                <span class="text-sm flex-1">• {{ highlight }}</span>
                <button
                  class="btn btn-ghost btn-xs btn-square"
                  @click="removeHighlight(item.id, hIndex)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="input-group input-group-sm">
                <input
                  v-model="newHighlight[item.id]"
                  type="text"
                  placeholder="Add achievement or responsibility"
                  class="input input-bordered input-sm flex-1"
                  @keyup.enter="addHighlight(item.id)"
                />
                <button
                  class="btn btn-primary btn-sm"
                  @click="addHighlight(item.id)"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-base-content/70 mt-2">
          <p class="font-medium">{{ item.company }}</p>
          <p class="text-xs">{{ item.startDate }} - {{ item.endDate || 'Present' }}</p>
        </div>
      </div>
    </div>

    <button class="btn btn-outline btn-block" @click="addItem">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Experience
    </button>
  </div>
</template>
