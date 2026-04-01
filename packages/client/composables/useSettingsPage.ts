import { createSettingsPageProviderActions } from "./settings-page/provider-actions";
import { createSettingsPageSaveActions } from "./settings-page/save-actions";
import { useSettingsPageState } from "./settings-page/state";

export function useSettingsPage() {
  const state = useSettingsPageState();
  const providerActions = createSettingsPageProviderActions(state);
  const saveActions = createSettingsPageSaveActions(state);

  return {
    ...state,
    ...providerActions,
    ...saveActions,
  };
}
