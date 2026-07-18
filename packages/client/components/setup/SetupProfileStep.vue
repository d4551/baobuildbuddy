<script setup lang="ts">
import { FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";

defineProps<{
  name: string;
  currentRole: string;
}>();

const emit = defineEmits<{
  "update:name": [value: string];
  "update:current-role": [value: string];
  next: [];
}>();

const { t } = useI18n();

function updateTextValue(event: Event, emitEvent: "update:name" | "update:current-role"): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit(emitEvent, target.value);
  }
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("setup.profileTitle") }}</h2>
    <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.nameLegend") }}</span>
      <input
        :value="name"
        type="text"
        :placeholder="t('setup.namePlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.nameAria')"
        @input="updateTextValue($event, 'update:name')"
      />
    </label>
    <label class="floating-label" :class="[FLUID_WIDTH_CLASS]">
      <span>{{ t("setup.currentRoleLegend") }}</span>
      <input
        :value="currentRole"
        type="text"
        :placeholder="t('setup.currentRolePlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('setup.currentRoleAria')"
        @input="updateTextValue($event, 'update:current-role')"
      />
    </label>

    <div class="flex justify-end">
      <button class="btn btn-primary" :aria-label="t('setup.nextToLocalAiAria')" @click="emit('next')">
        {{ t("setup.nextButton") }}
      </button>
    </div>
  </div>
</template>
