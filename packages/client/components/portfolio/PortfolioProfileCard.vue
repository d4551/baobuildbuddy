<script setup lang="ts">
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  portfolioForm: PortfolioMetadata;
}>();

const emit = defineEmits<{
  save: [];
  "update:portfolioForm": [value: PortfolioMetadata];
}>();

const { t } = useI18n();

function updatePortfolioField<K extends keyof PortfolioMetadata>(key: K, event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:portfolioForm", {
    ...props.portfolioForm,
    [key]: target.value,
  });
}
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("portfolioPage.profile.title") }}</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <fieldset class="fieldset lg:col-span-2">
          <legend class="fieldset-legend">{{ t("portfolioPage.profile.titleLegend") }}</legend>
          <input
            :value="props.portfolioForm.title"
            type="text"
            class="input w-full"
            :placeholder="t('portfolioPage.profile.titlePlaceholder')"
            :aria-label="t('portfolioPage.profile.titleAria')"
            @input="updatePortfolioField('title', $event)"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("portfolioPage.profile.emailLegend") }}</legend>
          <input
            :value="props.portfolioForm.email"
            type="email"
            class="input w-full"
            :placeholder="t('portfolioPage.profile.emailPlaceholder')"
            :aria-label="t('portfolioPage.profile.emailAria')"
            @input="updatePortfolioField('email', $event)"
          />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("portfolioPage.profile.websiteLegend") }}</legend>
          <input
            :value="props.portfolioForm.website"
            type="url"
            class="input w-full"
            :placeholder="t('portfolioPage.profile.websitePlaceholder')"
            :aria-label="t('portfolioPage.profile.websiteAria')"
            @input="updatePortfolioField('website', $event)"
          />
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">{{ t("portfolioPage.profile.bioLegend") }}</legend>
          <textarea
            :value="props.portfolioForm.bio"
            class="textarea w-full"
            rows="4"
            :placeholder="t('portfolioPage.profile.bioPlaceholder')"
            :aria-label="t('portfolioPage.profile.bioAria')"
            @input="updatePortfolioField('bio', $event)"
          ></textarea>
        </fieldset>
      </div>

      <div class="card-actions justify-end">
        <button class="btn btn-primary" :aria-label="t('portfolioPage.profile.saveAria')" @click="emit('save')">
          {{ t("portfolioPage.profile.saveButton") }}
        </button>
      </div>
    </div>
  </section>
</template>
