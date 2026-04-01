import { AI_PROVIDER_DEFAULT } from "@bao/shared/constants/ai-provider";
import type { AIProviderType } from "@bao/shared/types/ai";
import type { ComputedRef, Ref } from "vue";
import type { ProviderConfig } from "~/types/ai-dashboard";
import {
  resolveProviderMetadata,
  resolveProviderModelOptions,
  resolveProviderModelSelection,
} from "~/utils/ai-control-plane";

export function useAIDashboardSelection(
  settings: ReturnType<typeof useSettings>["settings"],
  providers: ComputedRef<ProviderConfig[]>,
) {
  const selectedProvider = ref<AIProviderType>(AI_PROVIDER_DEFAULT);
  const selectedModel = ref("");
  const selectedProviderModels = computed(() => {
    const matchingProvider = providers.value.find(
      (provider) => provider.id === selectedProvider.value,
    );
    return resolveProviderModelOptions(
      selectedProvider.value,
      settings.value,
      matchingProvider?.models ?? [],
    );
  });

  function resolveDefaultModel(providerId: AIProviderType): string {
    const matchingProvider = providers.value.find((provider) => provider.id === providerId);
    if (matchingProvider?.models[0]) {
      return matchingProvider.models[0];
    }

    const catalogEntry = resolveProviderMetadata(providerId);
    return catalogEntry?.modelHints[0] ?? "";
  }

  return {
    resolveDefaultModel,
    selectedModel,
    selectedProvider,
    selectedProviderModels,
  };
}

export function syncDashboardSelections(input: {
  dashboardBootstrap: Ref<
    { activeModel: string; activeProvider: AIProviderType } | null | undefined
  >;
  selectedProvider: Ref<AIProviderType>;
  selectedModel: Ref<string>;
  settings: ReturnType<typeof useSettings>["settings"];
  selectedProviderModels: ComputedRef<string[]>;
}) {
  watch(
    input.dashboardBootstrap,
    (value) => {
      if (!value) {
        return;
      }

      input.selectedProvider.value = value.activeProvider;
      input.selectedModel.value = value.activeModel;
    },
    { immediate: true },
  );

  watch(input.selectedProvider, (providerId) => {
    input.selectedModel.value = resolveProviderModelSelection(
      providerId,
      input.settings.value,
      input.selectedProviderModels.value,
    );
  });
}
