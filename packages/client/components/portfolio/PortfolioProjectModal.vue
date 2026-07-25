<script setup lang="ts">
import { PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH, PORTFOLIO_PROJECT_TITLE_MIN_LENGTH } from "@bao/shared/constants/portfolio";
import { useI18n } from "vue-i18n";
import AppProseField from "~/components/ui/AppProseField.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CIRCLE_DENSE_CLASS,
  GHOST_ACTION_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type PortfolioProjectForm = {
  title: string;
  description: string;
  technologies: string[];
  image: string;
  liveUrl: string;
  featured: boolean;
};

const props = defineProps<{
  open: boolean;
  titleId: string;
  editing: boolean;
  projectForm: PortfolioProjectForm;
  newTech: string;
  technologySuggestions: readonly string[];
}>();

const emit = defineEmits<{
  save: [];
  "update:newTech": [value: string];
  "update:open": [value: boolean];
  "update:projectForm": [value: PortfolioProjectForm];
  addTechnology: [];
  removeTechnology: [index: number];
}>();

const { t } = useI18n();

function handleTechnologyInput(event: Event): void {
  const input = event.target;
  if (input instanceof HTMLInputElement) {
    emit("update:newTech", input.value);
  }
}

function updateProjectTextField<K extends "title" | "description" | "image" | "liveUrl">(
  key: K,
  event: Event,
): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  emit("update:projectForm", {
    ...props.projectForm,
    [key]: target.value,
  });
}

function updateProjectStringField<K extends "title" | "description" | "image" | "liveUrl">(
  key: K,
  value: string,
): void {
  emit("update:projectForm", {
    ...props.projectForm,
    [key]: value,
  });
}

function updateFeaturedFlag(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  emit("update:projectForm", {
    ...props.projectForm,
    featured: target.checked,
  });
}
</script>

<template>
  <AppModalFrame
    :open="props.open"
    :title-id="props.titleId"
    size-token="compact"
    :close-aria-label="t('portfolioPage.modal.closeBackdropAria')"
    :close-backdrop-label="t('portfolioPage.modal.closeBackdropButton')"
    @update:open="emit('update:open', $event)"
  >
    <h3 :id="props.titleId" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.lg]">
      {{ props.editing ? t("portfolioPage.modal.editTitle") : t("portfolioPage.modal.addTitle") }}
    </h3>

    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("portfolioPage.modal.projectTitleLegend") }}</legend>
        <input 
          :value="props.projectForm.title"
          type="text"
          :minlength="PORTFOLIO_PROJECT_TITLE_MIN_LENGTH"
          class="input validator" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="t('portfolioPage.modal.projectTitlePlaceholder')"
          :aria-label="t('portfolioPage.modal.projectTitleAria')"
          @input="updateProjectTextField('title', $event)"
        />
        <p class="validator-hint">
          {{ t("portfolioPage.modal.projectTitleHint", { count: PORTFOLIO_PROJECT_TITLE_MIN_LENGTH }) }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("portfolioPage.modal.descriptionLegend") }}</legend>
        <AppProseField
          :model-value="props.projectForm.description"
          :placeholder="t('portfolioPage.modal.descriptionPlaceholder')"
          :aria-label="t('portfolioPage.modal.descriptionAria')"
          @update:model-value="updateProjectStringField('description', $event)"
        />
        <p class="validator-hint">
          {{ t("portfolioPage.modal.descriptionHint", { count: PORTFOLIO_PROJECT_DESCRIPTION_MIN_LENGTH }) }}
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("portfolioPage.modal.projectUrlLegend") }}</legend>
        <input 
          :value="props.projectForm.liveUrl"
          type="url"
          class="input" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="t('portfolioPage.modal.projectUrlPlaceholder')"
          :aria-label="t('portfolioPage.modal.projectUrlAria')"
          @input="updateProjectTextField('liveUrl', $event)"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("portfolioPage.modal.imageUrlLegend") }}</legend>
        <input 
          :value="props.projectForm.image"
          type="url"
          class="input" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="t('portfolioPage.modal.imageUrlPlaceholder')"
          :aria-label="t('portfolioPage.modal.imageUrlAria')"
          @input="updateProjectTextField('image', $event)"
        />
      </fieldset>

      <div>
        <span class="block font-medium" :class="[TYPOGRAPHY_SCALE_CLASS.sm, MARGIN_TOKEN_CLASS.mb2]">{{ t("portfolioPage.modal.technologiesLegend") }}</span>
        <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mb2]">
          <input 
            :value="props.newTech"
            type="text"
            class="input input-sm flex-1"
            :placeholder="t('portfolioPage.modal.technologiesPlaceholder')"
            :aria-label="t('portfolioPage.modal.technologiesAria')"
            list="portfolio-tech-suggestions"
            @input="handleTechnologyInput"
            @keyup.enter="emit('addTechnology')"
          />
          <button :class="[PRIMARY_ACTION_CLASS]" :aria-label="t('portfolioPage.modal.addTechnologyAria')" @click="emit('addTechnology')">
            {{ t("portfolioPage.modal.addTechnologyButton") }}
          </button>
        </div>

        <datalist id="portfolio-tech-suggestions">
          <option v-for="tech in props.technologySuggestions" :key="tech" :value="tech" />
        </datalist>

        <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <div 
            v-for="(tech, idx) in props.projectForm.technologies"
            :key="`${tech}-${idx}`"
            class="badge" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
          >
            {{ tech }}
            <button 
              type="button"
              :class="[TOUCH_TARGET_MIN_CLASS, GHOST_ACTION_CIRCLE_DENSE_CLASS]"
              :aria-label="t('portfolioPage.modal.removeTechnologyAria', { tech })"
              @click="emit('removeTechnology', idx)"
            >
              <CloseIcon :class="[ICON_SIZE_CLASS[3]]"/>
            </button>
          </div>
        </div>
      </div>

      <label class="label cursor-pointer justify-start" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
        <input 
          :checked="props.projectForm.featured"
          type="checkbox"
          class="checkbox checkbox-primary"
          :aria-label="t('portfolioPage.modal.featuredAria')"
          @change="updateFeaturedFlag"
        />
        <span class="label">{{ t("portfolioPage.modal.featuredLabel") }}</span>
      </label>
    </div>

    <div class="modal-action">
      <button :class="GHOST_ACTION_CLASS" :aria-label="t('portfolioPage.modal.cancelAria')" @click="emit('update:open', false)">
        {{ t("portfolioPage.modal.cancelButton") }}
      </button>
      <button 
        :class="[PRIMARY_ACTION_CLASS]"
        :disabled="!props.projectForm.title || !props.projectForm.description"
        :aria-label="t('portfolioPage.modal.saveAria')"
        @click="emit('save')"
      >
        {{ props.editing ? t("portfolioPage.modal.updateButton") : t("portfolioPage.modal.createButton") }}
      </button>
    </div>
  </AppModalFrame>
</template>
