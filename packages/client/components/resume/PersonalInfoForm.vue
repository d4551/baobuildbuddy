<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: typeof props.modelValue];
}>();

const localValue = ref({ ...props.modelValue });

watch(
  localValue,
  (newValue) => {
    emit("update:modelValue", { ...newValue });
  },
  { deep: true },
);

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = { ...newValue };
  },
  { deep: true },
);
</script>

<template>
  <fieldset class="fieldset border border-base-300 rounded-lg p-6">
    <legend class="fieldset-legend">Personal Information</legend>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="personal-name" class="label">Full Name</label>
        <input
          id="personal-name"
          v-model="localValue.name"
          type="text"
          placeholder="John Doe"
          class="input input-bordered"
          aria-label="John Doe"/>
      </div>

      <div>
        <label for="personal-email" class="label">Email</label>
        <input
          id="personal-email"
          v-model="localValue.email"
          type="email"
          placeholder="john@example.com"
          class="input input-bordered"
          aria-label="john@example.com"/>
      </div>

      <div>
        <label for="personal-phone" class="label">Phone</label>
        <input
          id="personal-phone"
          v-model="localValue.phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          class="input input-bordered"
          aria-label="+1 (555) 123-4567"/>
      </div>

      <div>
        <label for="personal-location" class="label">Location</label>
        <input
          id="personal-location"
          v-model="localValue.location"
          type="text"
          placeholder="San Francisco, CA"
          class="input input-bordered"
          aria-label="San Francisco, CA"/>
      </div>

      <div>
        <label for="personal-website" class="label">Website</label>
        <input
          id="personal-website"
          v-model="localValue.website"
          type="url"
          placeholder="https://yoursite.com"
          class="input input-bordered"
          aria-label="https://yoursite.com"/>
      </div>

      <div>
        <label for="personal-linkedin" class="label">LinkedIn</label>
        <input
          id="personal-linkedin"
          v-model="localValue.linkedin"
          type="url"
          placeholder="https://linkedin.com/in/johndoe"
          class="input input-bordered"
          aria-label="https://linkedin.com/in/johndoe"/>
      </div>

      <div class="md:col-span-2">
        <label for="personal-github" class="label">GitHub</label>
        <input
          id="personal-github"
          v-model="localValue.github"
          type="url"
          placeholder="https://github.com/johndoe"
          class="input input-bordered"
          aria-label="https://github.com/johndoe"/>
      </div>
    </div>
  </fieldset>
</template>
