import type { MaybeRefOrGetter, ShallowRef } from "vue";
import { getCurrentScope, onScopeDispose, toValue, watch } from "vue";

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

type FocusBoundary = {
  first: HTMLElement;
  last: HTMLElement;
};

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

function resolveFocusBoundary(dialog: HTMLDialogElement): FocusBoundary | null {
  const focusableElements = getFocusableElements(dialog);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);
  if (!(firstElement && lastElement)) {
    return null;
  }

  return {
    first: firstElement,
    last: lastElement,
  };
}

function focusDialogEntry(dialog: HTMLDialogElement): void {
  const boundary = resolveFocusBoundary(dialog);
  if (!boundary) {
    dialog.focus();
    return;
  }

  boundary.first.focus();
}

function resolveActiveElement(dialog: HTMLDialogElement): HTMLElement | null {
  const activeElement = document.activeElement;
  return activeElement instanceof HTMLElement && dialog.contains(activeElement) ? activeElement : null;
}

function cycleFocus(event: KeyboardEvent, dialog: HTMLDialogElement): void {
  const boundary = resolveFocusBoundary(dialog);
  if (!boundary) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const activeElement = resolveActiveElement(dialog);
  if (!activeElement) {
    event.preventDefault();
    boundary.first.focus();
    return;
  }

  if (event.shiftKey && activeElement === boundary.first) {
    event.preventDefault();
    boundary.last.focus();
    return;
  }

  if (!event.shiftKey && activeElement === boundary.last) {
    event.preventDefault();
    boundary.first.focus();
  }
}

/**
 * Traps keyboard focus inside an open dialog to keep modal interactions WCAG-compliant.
 */
export function useFocusTrap(
  dialogRef: Readonly<ShallowRef<HTMLDialogElement | null>>,
  enabled: MaybeRefOrGetter<boolean> = true,
): void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.value;
    if (!dialog?.open) {
      return;
    }

    cycleFocus(event, dialog);
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
      if (!(active && dialog)) {
        return;
      }

      focusDialogEntry(dialog);
      dialog.addEventListener("keydown", onKeyDown);
      releaseTrap = () => {
        dialog.removeEventListener("keydown", onKeyDown);
      };
    },
    { immediate: true, flush: "post" },
  );

  if (getCurrentScope()) {
    onScopeDispose(detachTrap);
  }
}
