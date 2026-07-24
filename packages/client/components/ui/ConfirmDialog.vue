<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import AppModalFrame from "~/components/ui/AppModalFrame.vue";
import {
  ERROR_ACTION_CLASS,
  GHOST_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type ConfirmDialogVariant = "default" | "danger";

const props = withDefaults(
  defineProps<{
    id: string;
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    /** When true, focus the confirm button instead of cancel. Use for destructive flows. */
    focusPrimary?: boolean;
  }>(),
  {
    confirmText: "",
    cancelText: "",
    variant: "default",
    focusPrimary: false,
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const cancelButtonRef = useTemplateRef<HTMLButtonElement>("cancelButton");
const confirmButtonRef = useTemplateRef<HTMLButtonElement>("confirmButton");
const { t } = useI18n();

const titleId = computed(() => `${props.id}-title`);
const descriptionId = computed(() => `${props.id}-message`);
const primaryActionRef = computed(() =>
  props.focusPrimary ? confirmButtonRef.value : cancelButtonRef.value,
);

const confirmButtonClass = computed(() =>
  props.variant === "danger" ? ERROR_ACTION_CLASS : PRIMARY_ACTION_CLASS,
);
const resolvedConfirmText = computed(() =>
  props.confirmText.trim().length > 0 ? props.confirmText : t("confirmDialog.confirmButton"),
);
const resolvedCancelText = computed(() =>
  props.cancelText.trim().length > 0 ? props.cancelText : t("confirmDialog.cancelButton"),
);

function applyActionTabOrder(): void {
  if (!cancelButtonRef.value || !confirmButtonRef.value) {
    return;
  }

  if (props.focusPrimary) {
    cancelButtonRef.value.tabIndex = -1;
    confirmButtonRef.value.tabIndex = 0;
    return;
  }

  cancelButtonRef.value.tabIndex = 0;
  confirmButtonRef.value.tabIndex = -1;
}

async function setFocusOnOpen(): Promise<void> {
  await nextTick();
  applyActionTabOrder();
  primaryActionRef.value?.focus();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    await setFocusOnOpen();
  },
  { immediate: true },
);

watch(
  () => props.focusPrimary,
  () => {
    applyActionTabOrder();
  },
);

function handleUpdateOpen(nextOpen: boolean): void {
  emit("update:open", nextOpen);
}

function closeDialog(): void {
  emit("update:open", false);
}

function handleConfirm(): void {
  emit("confirm");
  closeDialog();
}

function handleCancel(): void {
  emit("cancel");
  closeDialog();
}

function handleClose(): void {
  if (props.open) {
    emit("update:open", false);
  }
}
</script>

<template>
  <AppModalFrame
    :id="id"
    :open="open"
    :title-id="titleId"
    :described-by-id="descriptionId"
    :close-aria-label="resolvedCancelText"
    :close-backdrop-label="resolvedCancelText"
    @update:open="handleUpdateOpen"
    @close="handleClose"
  >
    <h3 :id="titleId" class="font-bold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ title }}</h3>
    <p :id="descriptionId" :class="[PADDING_TOKEN_CLASS.py4]">{{ message }}</p>
    <div class="modal-action">
      <button 
        ref="cancelButton"
        type="button"
        :class="[GHOST_ACTION_CLASS]"
        :aria-label="resolvedCancelText"
        @click="handleCancel"
      >
        {{ resolvedCancelText }}
      </button>
      <button 
        ref="confirmButton"
        type="button"
        :class="confirmButtonClass"
        :aria-label="resolvedConfirmText"
        @click="handleConfirm"
      >
        {{ resolvedConfirmText }}
      </button>
    </div>
  </AppModalFrame>
</template>
