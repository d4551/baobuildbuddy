import type { JobApplyAdapter, JobApplySelectorBundle } from "./adapters";
import type { SelectorMapInput } from "./runtime-contracts";
import { getCustomSelectorList } from "./runtime-locators";

export const getAdapterSelectorList = (
  adapter: JobApplyAdapter,
  selectorMap: SelectorMapInput,
  key: keyof JobApplySelectorBundle,
): string[] => [...getCustomSelectorList(selectorMap, key), ...adapter.selectors[key]];
