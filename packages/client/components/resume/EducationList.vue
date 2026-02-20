<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

const props = defineProps<{
  modelValue: EducationItem[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: EducationItem[]];
}>();
const { t } = useI18n();

const localValue = ref<EducationItem[]>([...props.modelValue]);
const editingId = ref<string | null>(null);

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
  const newItem: EducationItem = {
    id: Date.now().toString(),
    institution: "",
    degree: "",
    field: "",
    graduationDate: "",
    gpa: "",
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
            {{ item.degree || t("resumeComponentEducation.newItemTitle") }}
          </h3>
          <div class="flex gap-1">
            <button
              class="btn btn-ghost btn-xs btn-square"
              :aria-label="t('resumeComponentEducation.moveUpAria')"
              @click="moveUp(index)"
              :disabled="index === 0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square"
              :aria-label="t('resumeComponentEducation.moveDownAria')"
              @click="moveDown(index)"
              :disabled="index === localValue.length - 1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square"
              :aria-label="t('resumeComponentEducation.toggleEditAria')"
              @click="toggleEdit(item.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              class="btn btn-ghost btn-xs btn-square text-error"
              :aria-label="t('resumeComponentEducation.removeItemAria')"
              @click="removeItem(item.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="editingId === item.id" class="space-y-3 mt-2">
          <div class="form-control">
            <div class="label label-text-alt">{{ t("resumeComponentEducation.institutionLabel") }}</div>
            <input
              v-model="item.institution"
              type="text"
              :placeholder="t('resumeComponentEducation.institutionPlaceholder')"
              class="input input-bordered input-sm"
              @input="updateValue"
              :aria-label="t('resumeComponentEducation.institutionAria')"/>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-control">
              <div class="label label-text-alt">{{ t("resumeComponentEducation.degreeLabel") }}</div>
              <input
                v-model="item.degree"
                type="text"
                :placeholder="t('resumeComponentEducation.degreePlaceholder')"
                class="input input-bordered input-sm"
                @input="updateValue"
                :aria-label="t('resumeComponentEducation.degreeAria')"/>
            </div>
            <div class="form-control">
              <div class="label label-text-alt">{{ t("resumeComponentEducation.fieldLabel") }}</div>
              <input
                v-model="item.field"
                type="text"
                :placeholder="t('resumeComponentEducation.fieldPlaceholder')"
                class="input input-bordered input-sm"
                @input="updateValue"
                :aria-label="t('resumeComponentEducation.fieldAria')"/>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-control">
              <div class="label label-text-alt">{{ t("resumeComponentEducation.graduationDateLabel") }}</div>
              <input
                v-model="item.graduationDate"
                type="month"
                class="input input-bordered input-sm"
                @input="updateValue"
                :aria-label="t('resumeComponentEducation.graduationDateAria')"/>
            </div>
            <div class="form-control">
              <div class="label label-text-alt">{{ t("resumeComponentEducation.gpaLabel") }}</div>
              <input
                v-model="item.gpa"
                type="text"
                :placeholder="t('resumeComponentEducation.gpaPlaceholder')"
                class="input input-bordered input-sm"
                @input="updateValue"
                :aria-label="t('resumeComponentEducation.gpaAria')"/>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-base-content/70 mt-2">
          <p class="font-medium">{{ item.institution }}</p>
          <p class="text-xs">{{ item.field }}</p>
          <p class="text-xs">{{ item.graduationDate }}</p>
        </div>
      </div>
    </div>

    <button class="btn btn-outline btn-block" :aria-label="t('resumeComponentEducation.addItemAria')" @click="addItem">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {{ t("resumeComponentEducation.addItemButton") }}
    </button>
  </div>
</template>
