<script setup lang="ts">
const props = defineProps<{
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function handleConfirm() {
  emit("confirm");
  const dialog = document.getElementById(props.id) as HTMLDialogElement;
  dialog?.close();
}

function handleCancel() {
  emit("cancel");
  const dialog = document.getElementById(props.id) as HTMLDialogElement;
  dialog?.close();
}
</script>

<template>
  <dialog :id="id" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <button class="btn" @click="handleCancel">{{ cancelText || "Cancel" }}</button>
        <button class="btn btn-primary" @click="handleConfirm">{{ confirmText || "Confirm" }}</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="handleCancel">close</button>
    </form>
  </dialog>
</template>
