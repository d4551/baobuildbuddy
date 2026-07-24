import { describe, expect, it, vi } from "vitest";
import type { ComposerTranslation } from "vue-i18n";
import { runExportWithToast } from "./export-with-toast";

const identityT = ((key: string) => key) as ComposerTranslation;

describe("runExportWithToast", () => {
  it("toasts success when export resolves", async () => {
    const toast = { success: vi.fn(), error: vi.fn() };
    const ok = await runExportWithToast({
      exportFn: () => Promise.resolve(undefined),
      failMessage: "fail",
      successMessage: "ok",
      toast,
      t: identityT,
    });
    expect(ok).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("ok");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts error when export rejects", async () => {
    const toast = { success: vi.fn(), error: vi.fn() };
    const ok = await runExportWithToast({
      exportFn: () => Promise.reject(new Error("boom")),
      failMessage: "fail",
      successMessage: "ok",
      toast,
      t: identityT,
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
