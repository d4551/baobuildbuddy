<script setup lang="ts">
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
        <span class="label-text font-bold">Technical Skills</span>
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
          placeholder="e.g., Unity, C#, Unreal Engine"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('technical')"
          aria-label="e.g., Unity, C#, Unreal Engine"/>
        <button
          class="btn btn-primary"
          @click="addSkill('technical')"
        >
          Add
        </button>
      </div>
    </div>

    <!-- Soft Skills -->
    <div class="form-control">
      <div class="label">
        <span class="label-text font-bold">Soft Skills</span>
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
          placeholder="e.g., Leadership, Communication, Problem Solving"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('soft')"
          aria-label="e.g., Leadership, Communication, Problem Solving"/>
        <button
          class="btn btn-secondary"
          @click="addSkill('soft')"
        >
          Add
        </button>
      </div>
    </div>

    <!-- Gaming Skills -->
    <div class="form-control">
      <div class="label">
        <span class="label-text font-bold">Gaming Industry Skills</span>
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
          placeholder="e.g., Game Design, Level Design, Multiplayer Systems"
          class="input input-bordered flex-1"
          @keyup.enter="addSkill('gaming')"
          aria-label="e.g., Game Design, Level Design, Multiplayer Systems"/>
        <button
          class="btn btn-accent"
          @click="addSkill('gaming')"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>
