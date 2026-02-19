import type { AppSettings } from "@bao/shared";
import { useQuery } from "@tanstack/vue-query";

export function useSettingsQuery() {
  const api = useApi();

  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<AppSettings> => {
      const { data, error } = await api.settings.get();
      if (error) {
        throw new Error(error.value?.message || "Failed to load settings");
      }
      if (!data) {
        throw new Error("Missing settings response");
      }
      return data as AppSettings;
    },
  });
}
