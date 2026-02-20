<script setup lang="ts">
import { useTemplateRef } from "vue";

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
  }>(),
  {
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const dialogRef = useTemplateRef<HTMLDialogElement>("confirmDialog");
const cancelButtonRef = useTemplateRef<HTMLButtonElement>("cancelButton");
useFocusTrap(dialogRef, () => props.open);

const confirmButtonClass = computed(() =>
  props.variant === "danger" ? "btn btn-error" : "btn btn-primary",
);

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      nextTick(() => {
        cancelButtonRef.value?.focus();
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
  <dialog :id="id" ref="confirmDialog" class="modal modal-bottom sm:modal-middle" @close="handleClose">
    <div class="modal-box">
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button ref="cancelButton" type="button" class="btn" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button type="button" :class="confirmButtonClass" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="button" :aria-label="cancelText" @click="handleCancel"></button>
    </form>
  </dialog>
</template>
