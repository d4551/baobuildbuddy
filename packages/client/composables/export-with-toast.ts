import type { ComposerTranslation } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

type ToastApi = {
  error: (message: string) => void;
  success: (message: string) => void;
};

/**
 * Shared binary export toast flow for resume / cover letter / portfolio surfaces.
 */
export async function runExportWithToast(options: {
  readonly exportFn: () => Promise<unknown>;
  readonly failMessage: string;
  readonly successMessage: string;
  readonly toast: ToastApi;
  readonly t: ComposerTranslation;
}): Promise<boolean> {
  const exportResult = await settlePromise(options.exportFn(), options.failMessage);
  if (!exportResult.ok) {
    options.toast.error(getErrorMessage(exportResult.error, options.failMessage));
    return false;
  }
  options.toast.success(options.successMessage);
  return true;
}
