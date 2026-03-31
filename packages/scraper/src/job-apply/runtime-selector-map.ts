import type { JobApplyStrategy, JobApplySelectorBundle } from "./adapters";
import type { SelectorMapInput } from "./runtime-contracts";
import { getCustomSelectorList } from "./runtime-locators";

export const getStrategySelectorList = (
  strategy: JobApplyStrategy,
  selectorMap: SelectorMapInput,
  key: keyof JobApplySelectorBundle,
): string[] => [...getCustomSelectorList(selectorMap, key), ...strategy.selectors[key]];
