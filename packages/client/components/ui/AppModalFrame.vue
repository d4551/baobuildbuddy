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
const resolvedDescribedById = computed(() => props.describedById?.trim() ?? "");

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
  emit("close");
}

function handleNativeClose(): void {
  // Escape / method=dialog close — sync Vue open state + notify consumers.
  emit("close");
  if (props.open) {
    emit("update:open", false);
  }
}

function handleCancel(event: Event): void {
  // Keep cancel → close pipeline; ensure Vue state follows Escape.
  event.preventDefault();
  requestClose();
}
</script>

<template>
  <dialog 
    :id="id"
    ref="modalFrame"
    class="modal modal-bottom sm:modal-middle"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="resolvedDescribedById.length > 0 ? resolvedDescribedById : undefined"
    @cancel="handleCancel"
    @close="handleNativeClose"
  >
    <div class="modal-box glass-modal" :class="modalBoxClass">
      <slot />
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" :aria-label="closeAriaLabel">
        {{ backdropButtonLabel }}
      </button>
    </form>
  </dialog>
</template>
