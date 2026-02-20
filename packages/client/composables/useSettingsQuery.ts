import type { AppSettings } from "@bao/shared";
import { useQuery } from "@tanstack/vue-query";
import { toAppSettings } from "./api-normalizers";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toErrorMessage = (value: unknown): string | undefined => {
  if (!isRecord(value)) return undefined;
  return typeof value.message === "string" ? value.message : undefined;
};

export function useSettingsQuery() {
  const api = useApi();

  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await api.settings.get();
      if (error) {
        throw new Error(toErrorMessage(error.value) ?? "Failed to load settings");
      }
      if (!data) {
        throw new Error("Missing settings response");
      }
      const normalized = toAppSettings(data);
      if (!normalized) {
        throw new Error("Invalid settings payload");
      }
      return normalized;
    },
  });
}
