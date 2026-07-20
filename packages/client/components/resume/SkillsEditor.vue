<script setup lang="ts">
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

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
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4, PADDING_TOKEN_CLASS.p6]">
    <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("resumePage.skills.title") }}</h2>
    <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mb4]">
      <input 
        v-model="newSkill"
        type="text"
        :placeholder="t('resumePage.skills.inputPlaceholder')"
        class="input input-sm flex-1"
        :aria-label="t('resumePage.skills.inputAria')"
        @keyup.enter="addSkill"
      />
      <button 
        class="btn btn-primary"
        :aria-label="t('resumePage.skills.addButtonAria')"
        @click="addSkill"
      >
        {{ t("resumePage.skills.addButton") }}
      </button>
    </div>
    <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
      <div 
        v-for="(skill, index) in localValue"
        :key="`${skill}-${index}`"
        class="badge badge-lg" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
      >
        {{ skill }}
        <button 
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          :aria-label="t('resumePage.skills.removeButtonAria', { index: index + 1 })"
          @click="removeSkill(index)"
        >
          <CloseIcon :class="[ICON_SIZE_CLASS[3]]"/>
        </button>
      </div>
    </div>
  </div>
</template>
