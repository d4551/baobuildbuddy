import type { MaybeRefOrGetter, ShallowRef } from "vue";
import { toValue } from "vue";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isVisibleElement(element: HTMLElement): boolean {
  return element.getClientRects().length > 0;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      isVisibleElement(element),
  );
}

/**
 * Traps keyboard focus inside an open dialog to keep modal interactions WCAG-compliant.
 */
export function useFocusTrap(
  dialogRef: Readonly<ShallowRef<HTMLDialogElement | null>>,
  enabled: MaybeRefOrGetter<boolean> = true,
): void {
  const focusFirstElement = (dialog: HTMLDialogElement): void => {
    const focusableElements = getFocusableElements(dialog);
    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
      return;
    }
    dialog.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.value;
    if (!dialog || !dialog.open) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !dialog.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus();
      return;
    }

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  let releaseTrap: (() => void) | null = null;

  const detachTrap = (): void => {
    releaseTrap?.();
    releaseTrap = null;
  };

  watch(
    () => {
      const dialog = dialogRef.value;
      return Boolean(dialog?.open && toValue(enabled));
    },
    (active) => {
      detachTrap();

      const dialog = dialogRef.value;
      if (!active || !dialog) {
        return;
      }

      focusFirstElement(dialog);
      dialog.addEventListener("keydown", onKeyDown);
      releaseTrap = () => {
        dialog.removeEventListener("keydown", onKeyDown);
      };
    },
    { immediate: true, flush: "post" },
  );

  onUnmounted(() => {
    detachTrap();
  });
}
