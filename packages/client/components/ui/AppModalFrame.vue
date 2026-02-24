<script setup lang="ts">
import { useTemplateRef } from "vue";
import { UI_MODAL_SIZE_CLASS_BY_TOKEN, type UiModalSizeToken } from "~/constants/ui-layout";

const props = withDefaults(
  defineProps<{
    id?: string;
    open: boolean;
    titleId: string;
    describedById?: string;
    sizeToken?: UiModalSizeToken;
    closeAriaLabel: string;
    closeBackdropLabel?: string;
  }>(),
  {
    id: undefined,
    describedById: undefined,
    sizeToken: "standard",
    closeBackdropLabel: "",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const dialogRef = useTemplateRef<HTMLDialogElement>("modalFrame");
useFocusTrap(dialogRef, () => props.open);

const modalBoxClass = computed(() => UI_MODAL_SIZE_CLASS_BY_TOKEN[props.sizeToken]);
const backdropButtonLabel = computed(() =>
  props.closeBackdropLabel.trim().length > 0 ? props.closeBackdropLabel : props.closeAriaLabel,
);

watch(
  () => props.open,
  (isOpen) => {
    const dialog = dialogRef.value;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  },
  { immediate: true },
);

function requestClose(): void {
  emit("update:open", false);
}

function handleClose(): void {
  emit("close");
  if (props.open) {
    emit("update:open", false);
  }
}
</script>

<template>
  <dialog
    :id="id"
    ref="modalFrame"
    class="modal modal-bottom sm:modal-middle"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="describedById"
    @close="handleClose"
  >
    <div class="modal-box" :class="modalBoxClass">
      <slot />
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="button" :aria-label="closeAriaLabel" @click="requestClose">
        {{ backdropButtonLabel }}
      </button>
    </form>
  </dialog>
</template>
