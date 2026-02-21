<script setup lang="ts">
import type { ToastType } from "~/composables/useToast";
import { useI18n } from "vue-i18n";
import CloseIcon from "~/components/ui/CloseIcon.vue";

const { toasts, removeToast } = useToast();
const { t } = useI18n();

const alertClassByType = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
} satisfies Record<ToastType, string>;

const iconPathByType = {
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
  info: "M13 16h-1v-4h-1m1-4h.01",
  warning:
    "M12 9v3m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z",
} satisfies Record<ToastType, string>;

function resolveAlertClass(type: ToastType): string {
  return alertClassByType[type];
}

function resolveIconPath(type: ToastType): string {
  return iconPathByType[type];
}
</script>

<template>
  <div
    class="toast toast-top toast-center z-[1000] pointer-events-none"
    aria-live="polite"
    aria-atomic="false"
    :aria-label="t('a11y.notifications')"
  >
    <TransitionGroup name="toast-motion" tag="div" class="flex w-full max-w-md flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="alert shadow-lg pointer-events-auto items-start"
        :class="resolveAlertClass(toast.type)"
        :role="toast.type === 'error' ? 'alert' : 'status'"
        :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
      >
        <svg
          class="mt-0.5 h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="resolveIconPath(toast.type)" />
        </svg>

        <div class="min-w-0 grow">
          <h3 class="font-bold">{{ toast.title }}</h3>
          <p class="text-sm break-words">{{ toast.message }}</p>
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-circle btn-xs"
          :aria-label="t('a11y.dismissNotification')"
          @click="removeToast(toast.id)"
        >
          <CloseIcon />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-motion-enter-active,
.toast-motion-leave-active,
.toast-motion-move {
  transition: all 0.2s ease;
}

.toast-motion-enter-from,
.toast-motion-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.98);
}
</style>
