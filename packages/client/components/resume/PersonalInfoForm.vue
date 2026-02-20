<script setup lang="ts">
import { useI18n } from "vue-i18n";

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
const { t } = useI18n();

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
    <legend class="fieldset-legend">{{ t("resumeComponentPersonalInfo.title") }}</legend>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="personal-name" class="label">{{ t("resumeComponentPersonalInfo.nameLabel") }}</label>
        <input
          id="personal-name"
          v-model="localValue.name"
          type="text"
          :placeholder="t('resumeComponentPersonalInfo.namePlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.nameAria')"/>
      </div>

      <div>
        <label for="personal-email" class="label">{{ t("resumeComponentPersonalInfo.emailLabel") }}</label>
        <input
          id="personal-email"
          v-model="localValue.email"
          type="email"
          :placeholder="t('resumeComponentPersonalInfo.emailPlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.emailAria')"/>
      </div>

      <div>
        <label for="personal-phone" class="label">{{ t("resumeComponentPersonalInfo.phoneLabel") }}</label>
        <input
          id="personal-phone"
          v-model="localValue.phone"
          type="tel"
          :placeholder="t('resumeComponentPersonalInfo.phonePlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.phoneAria')"/>
      </div>

      <div>
        <label for="personal-location" class="label">{{ t("resumeComponentPersonalInfo.locationLabel") }}</label>
        <input
          id="personal-location"
          v-model="localValue.location"
          type="text"
          :placeholder="t('resumeComponentPersonalInfo.locationPlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.locationAria')"/>
      </div>

      <div>
        <label for="personal-website" class="label">{{ t("resumeComponentPersonalInfo.websiteLabel") }}</label>
        <input
          id="personal-website"
          v-model="localValue.website"
          type="url"
          :placeholder="t('resumeComponentPersonalInfo.websitePlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.websiteAria')"/>
      </div>

      <div>
        <label for="personal-linkedin" class="label">{{ t("resumeComponentPersonalInfo.linkedinLabel") }}</label>
        <input
          id="personal-linkedin"
          v-model="localValue.linkedin"
          type="url"
          :placeholder="t('resumeComponentPersonalInfo.linkedinPlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.linkedinAria')"/>
      </div>

      <div class="md:col-span-2">
        <label for="personal-github" class="label">{{ t("resumeComponentPersonalInfo.githubLabel") }}</label>
        <input
          id="personal-github"
          v-model="localValue.github"
          type="url"
          :placeholder="t('resumeComponentPersonalInfo.githubPlaceholder')"
          class="input input-bordered"
          :aria-label="t('resumeComponentPersonalInfo.githubAria')"/>
      </div>
    </div>
  </fieldset>
</template>
