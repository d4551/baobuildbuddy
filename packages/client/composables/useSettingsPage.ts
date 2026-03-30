import { createSettingsPageProviderActions } from "./settings-page/provider-actions";
import { createSettingsPageSaveActions } from "./settings-page/save-actions";
import { useSettingsPageState } from "./settings-page/state";

export async function useSettingsPage() {
  const state = await useSettingsPageState();
  const providerActions = createSettingsPageProviderActions(state);
  const saveActions = createSettingsPageSaveActions(state);

  return {
    ...state,
    ...providerActions,
    ...saveActions,
  };
}
