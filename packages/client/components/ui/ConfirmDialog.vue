<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

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

const dialogRef = useTemplateRef<HTMLDialogElement>("confirmDialog");
const cancelButtonRef = useTemplateRef<HTMLButtonElement>("cancelButton");
const confirmButtonRef = useTemplateRef<HTMLButtonElement>("confirmButton");
const { t } = useI18n();
useFocusTrap(dialogRef, () => props.open);

const confirmButtonClass = computed(() =>
  props.variant === "danger" ? "btn btn-error" : "btn btn-primary",
);
const resolvedConfirmText = computed(() =>
  props.confirmText.trim().length > 0 ? props.confirmText : t("confirmDialog.confirmButton"),
);
const resolvedCancelText = computed(() =>
  props.cancelText.trim().length > 0 ? props.cancelText : t("confirmDialog.cancelButton"),
);

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      nextTick(() => {
        const target = props.focusPrimary ? confirmButtonRef.value : cancelButtonRef.value;
        target?.focus();
      });
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  },
  { immediate: true },
);

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
  <dialog
    :id="id"
    ref="confirmDialog"
    class="modal modal-bottom sm:modal-middle"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="`${id}-message`"
    aria-modal="true"
    @close="handleClose"
  >
    <div class="modal-box">
      <h3 :id="`${id}-title`" class="text-lg font-bold">{{ title }}</h3>
      <p :id="`${id}-message`" class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button ref="cancelButton" type="button" class="btn" :aria-label="resolvedCancelText" @click="handleCancel">
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
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="button" :aria-label="resolvedCancelText" @click="handleCancel"></button>
    </form>
  </dialog>
</template>
