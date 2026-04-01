<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();
const { t } = useI18n();

const localValue = ref<string[]>([...props.modelValue]);
const newSkill = ref("");

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = [...newValue];
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", [...localValue.value]);
}

function addSkill(): void {
  const trimmedSkill = newSkill.value.trim();
  if (trimmedSkill.length === 0) {
    return;
  }

  localValue.value.push(trimmedSkill);
  newSkill.value = "";
  emitValue();
}

function removeSkill(index: number): void {
  localValue.value.splice(index, 1);
  emitValue();
}
</script>

<template>
  <div class="space-y-4 p-6">
    <h2 class="text-lg font-semibold">{{ t("resumePage.skills.title") }}</h2>
    <div class="mb-4 flex gap-2">
      <input
        v-model="newSkill"
        type="text"
        :placeholder="t('resumePage.skills.inputPlaceholder')"
        class="input input-sm flex-1"
        :aria-label="t('resumePage.skills.inputAria')"
        @keyup.enter="addSkill"
      />
      <button
        class="btn btn-sm btn-primary"
        :aria-label="t('resumePage.skills.addButtonAria')"
        @click="addSkill"
      >
        {{ t("resumePage.skills.addButton") }}
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="(skill, index) in localValue"
        :key="`${skill}-${index}`"
        class="badge badge-lg gap-2"
      >
        {{ skill }}
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          :aria-label="t('resumePage.skills.removeButtonAria', { index: index + 1 })"
          @click="removeSkill(index)"
        >
          <CloseIcon class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>
