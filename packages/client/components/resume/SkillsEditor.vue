<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  modelValue: {
    technical: string[];
    soft: string[];
    gaming?: string[];
  };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: typeof props.modelValue];
}>();
const { t } = useI18n();

const localValue = ref({
  technical: [...(props.modelValue.technical || [])],
  soft: [...(props.modelValue.soft || [])],
  gaming: [...(props.modelValue.gaming || [])],
});

const newSkill = ref({
  technical: "",
  soft: "",
  gaming: "",
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = {
      technical: [...(newValue.technical || [])],
      soft: [...(newValue.soft || [])],
      gaming: [...(newValue.gaming || [])],
    };
  },
  { deep: true },
);

function updateValue() {
  emit("update:modelValue", {
    technical: [...localValue.value.technical],
    soft: [...localValue.value.soft],
    gaming: [...localValue.value.gaming],
  });
}

function addSkill(category: "technical" | "soft" | "gaming") {
  const skill = newSkill.value[category].trim();
  if (!skill) return;

  if (!localValue.value[category].includes(skill)) {
    localValue.value[category].push(skill);
    newSkill.value[category] = "";
    updateValue();
  }
}

function removeSkill(category: "technical" | "soft" | "gaming", index: number) {
  localValue.value[category].splice(index, 1);
  updateValue();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Technical Skills -->
    <div class="form-control">
      <div class="label">
        <span class="label-text font-bold">{{ t("resumeComponentSkills.technicalTitle") }}</span>
      </div>
      <div class="flex flex-wrap gap-2 mb-3">
        <div
          v-for="(skill, index) in localValue.technical"
          :key="index"
          class="badge badge-primary gap-2"
        >
          {{ skill }}
          <button
            class="btn btn-ghost btn-xs btn-circle"
            :aria-label="t('resumeComponentSkills.removeSkillAria', { category: t('resumeComponentSkills.technicalTitle'), skill })"
            @click="removeSkill('technical', index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="input-group">
        <input
          v-model="newSkill.technical"
          type="text"
          :placeholder="t('resumeComponentSkills.technicalPlaceholder')"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('technical')"
          :aria-label="t('resumeComponentSkills.technicalAria')"/>
        <button
          class="btn btn-primary"
          :aria-label="t('resumeComponentSkills.addSkillAria', { category: t('resumeComponentSkills.technicalTitle') })"
          @click="addSkill('technical')"
        >
          {{ t("resumeComponentSkills.addButton") }}
        </button>
      </div>
    </div>

    <!-- Soft Skills -->
    <div class="form-control">
      <div class="label">
        <span class="label-text font-bold">{{ t("resumeComponentSkills.softTitle") }}</span>
      </div>
      <div class="flex flex-wrap gap-2 mb-3">
        <div
          v-for="(skill, index) in localValue.soft"
          :key="index"
          class="badge badge-secondary gap-2"
        >
          {{ skill }}
          <button
            class="btn btn-ghost btn-xs btn-circle"
            :aria-label="t('resumeComponentSkills.removeSkillAria', { category: t('resumeComponentSkills.softTitle'), skill })"
            @click="removeSkill('soft', index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="input-group">
        <input
          v-model="newSkill.soft"
          type="text"
          :placeholder="t('resumeComponentSkills.softPlaceholder')"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('soft')"
          :aria-label="t('resumeComponentSkills.softAria')"/>
        <button
          class="btn btn-secondary"
          :aria-label="t('resumeComponentSkills.addSkillAria', { category: t('resumeComponentSkills.softTitle') })"
          @click="addSkill('soft')"
        >
          {{ t("resumeComponentSkills.addButton") }}
        </button>
      </div>
    </div>

    <!-- Gaming Skills -->
    <div class="form-control">
      <div class="label">
        <span class="label-text font-bold">{{ t("resumeComponentSkills.gamingTitle") }}</span>
      </div>
      <div class="flex flex-wrap gap-2 mb-3">
        <div
          v-for="(skill, index) in localValue.gaming"
          :key="index"
          class="badge badge-accent gap-2"
        >
          {{ skill }}
          <button
            class="btn btn-ghost btn-xs btn-circle"
            :aria-label="t('resumeComponentSkills.removeSkillAria', { category: t('resumeComponentSkills.gamingTitle'), skill })"
            @click="removeSkill('gaming', index)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="input-group">
        <input
          v-model="newSkill.gaming"
          type="text"
          :placeholder="t('resumeComponentSkills.gamingPlaceholder')"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('gaming')"
          :aria-label="t('resumeComponentSkills.gamingAria')"/>
        <button
          class="btn btn-accent"
          :aria-label="t('resumeComponentSkills.addSkillAria', { category: t('resumeComponentSkills.gamingTitle') })"
          @click="addSkill('gaming')"
        >
          {{ t("resumeComponentSkills.addButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
