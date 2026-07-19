import type { SelectorMapInput } from "./runtime-contracts";
import { getCustomSelectorList } from "./runtime-locators";
import type { JobApplySelectorBundle, JobApplyStrategy } from "./strategy-registry";

export const getStrategySelectorList = (
  strategy: JobApplyStrategy,
  selectorMap: SelectorMapInput,
  key: keyof JobApplySelectorBundle,
): string[] => [...getCustomSelectorList(selectorMap, key), ...strategy.selectors[key]];
