import type { AppSettings } from "@bao/shared";
import { isRecord } from "@bao/shared";
import { useQuery } from "@tanstack/vue-query";
import { useI18n } from "vue-i18n";
import { toAppSettings } from "./api-normalizers";

const toErrorMessage = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  return typeof value.message === "string" ? value.message : undefined;
};

export function useSettingsQuery() {
  const api = useApi();
  const { t } = useI18n();

  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await api.settings.get();
      if (error) {
        throw new Error(toErrorMessage(error.value) ?? t("apiErrors.settings.loadFailed"));
      }
      if (!data) {
        throw new Error(t("apiErrors.settings.missingResponse"));
      }
      const normalized = toAppSettings(data);
      if (!normalized) {
        throw new Error(t("apiErrors.settings.invalidPayload"));
      }
      return normalized;
    },
  });
}
