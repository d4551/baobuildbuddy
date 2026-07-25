<script setup lang="ts">
import { useTemplateRef } from "vue";
import CloseIcon from "~/components/ui/CloseIcon.vue";
import { GHOST_ACTION_CIRCLE_DENSE_CLASS, ICON_SIZE_CLASS, TOUCH_TARGET_MIN_CLASS } from "~/constants/layout";
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
  const dialog = dialogRef.value;
  if (dialog?.open) {
    dialog.close();
  }
}

function handleNativeClose(): void {
  if (props.open) {
    emit("update:open", false);
  }
  emit("close");
}

function handleCancel(event: Event): void {
  // Escape: own the dismiss path so Vue `open` cannot desync from dialog.open.
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
    <div class="modal-box glass-modal relative" :class="modalBoxClass">
      <button
        type="button"
 class="absolute end-2 top-2"
 :class="[GHOST_ACTION_CIRCLE_DENSE_CLASS, TOUCH_TARGET_MIN_CLASS]"
 :aria-label="closeAriaLabel"
 @click="requestClose"
 >
        <CloseIcon :class="ICON_SIZE_CLASS.sm" aria-hidden="true" />
      </button>
      <div class="pe-12">
        <slot />
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit" :aria-label="closeAriaLabel">
        {{ backdropButtonLabel }}
      </button>
    </form>
  </dialog>
</template>
