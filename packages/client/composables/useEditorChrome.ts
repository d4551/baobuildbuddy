import { settle } from "@bao/shared/utils/promise";
import { EDITOR_AUTOSAVE_DEBOUNCE_MS } from "~/constants/editor";

/**
 * Dirty tracking + debounced autosave for writing/JSON editors.
 */
export function useEditorChrome(options: {
  readonly getFingerprint: () => string;
  readonly onAutosave: () => void | Promise<void>;
  readonly debounceMs?: number;
}) {
  const savedFingerprint = ref(options.getFingerprint());
  const isDirty = computed(() => options.getFingerprint() !== savedFingerprint.value);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const markSaved = (): void => {
    savedFingerprint.value = options.getFingerprint();
  };

  const scheduleAutosave = (): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      if (!isDirty.value) {
        return;
      }
      settle(Promise.resolve(options.onAutosave())).then(
        (result) => {
          if (result.status === "fulfilled") {
            markSaved();
          }
        },
        () => undefined,
      );
    }, options.debounceMs ?? EDITOR_AUTOSAVE_DEBOUNCE_MS);
  };

  const notifyEdited = (): void => {
    scheduleAutosave();
  };

  onBeforeUnmount(() => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  });

  return {
    isDirty,
    markSaved,
    notifyEdited,
    scheduleAutosave,
  };
}
