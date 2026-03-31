import { settle } from "@bao/shared/utils/promise";
import type { Locator, Page } from "playwright";
import {
  BOOLEAN_FALSE_ANSWERS,
  BOOLEAN_TRUE_ANSWERS,
  type LocatorControlDescriptor,
  PLAYWRIGHT_ACTION_TIMEOUT_MS,
  PLAYWRIGHT_RETRY_INITIAL_DELAY_MS,
  PLAYWRIGHT_RETRY_MAX_ATTEMPTS,
  type SelectorMapInput,
} from "./runtime-contracts";

export const anchorSelectorByText = (text: string): string => `a:has-text('${text}')`;

export const anchorSelectorByHrefFragment = (fragment: string): string => `a[href*='${fragment}']`;

export const inputSelectorByName = (fieldName: string): string => `input[name='${fieldName}']`;

export const inputSelectorById = (fieldId: string): string => `input[id='${fieldId}']`;

export const textareaSelectorByName = (fieldName: string): string =>
  `textarea[name='${fieldName}']`;

export const textareaSelectorById = (fieldId: string): string => `textarea[id='${fieldId}']`;

export const selectSelectorByName = (fieldName: string): string => `select[name='${fieldName}']`;

export const selectSelectorById = (fieldId: string): string => `select[id='${fieldId}']`;

export const APPLY_LINK_SELECTOR = [
  anchorSelectorByText("Apply"),
  anchorSelectorByHrefFragment(["boards", "greenhouse", "io"].join(".")),
  anchorSelectorByHrefFragment(["jobs", "lever", "co"].join(".")),
  anchorSelectorByHrefFragment("apply"),
].join(", ");

export const isRetryablePlaywrightError = (reason: unknown): boolean => {
  const msg = String(reason).toLowerCase();
  return msg.includes("timeout") || msg.includes("target closed") || msg.includes("network");
};

export const waitMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (typeof t === "object" && t !== null && "unref" in t && typeof t.unref === "function") {
      t.unref();
    }
  });

export const getCustomSelectorList = (selectorMap: SelectorMapInput, key: string): string[] => {
  const selectors = selectorMap[key];
  return Array.isArray(selectors) ? selectors.filter((selector) => selector.trim().length > 0) : [];
};

export const getCustomFieldSelectorList = (fieldKey: string): string[] => [
  textareaSelectorByName(fieldKey),
  inputSelectorByName(fieldKey),
  selectSelectorByName(fieldKey),
  textareaSelectorById(fieldKey),
  inputSelectorById(fieldKey),
  selectSelectorById(fieldKey),
];

export const runOnFirstMatchingLocator = async <T>(
  page: Page,
  selectors: readonly string[],
  action: (locator: Locator) => Promise<T | null>,
): Promise<T | null> => {
  const [selector, ...remainingSelectors] = selectors;
  if (!selector) {
    return null;
  }

  const locator = page.locator(selector).first();
  const countResult = await settle(locator.count());
  if (countResult.status === "fulfilled" && countResult.value > 0) {
    const actionResult = await action(locator);
    if (actionResult !== null) {
      return actionResult;
    }
  }

  return runOnFirstMatchingLocator(page, remainingSelectors, action);
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<T | null> => {
  const runAttempt = async (attempt: number, delayMs: number): Promise<T | null> => {
    const result = await settle(fn());
    if (result.status === "fulfilled") {
      return result.value;
    }
    if (attempt >= (options.maxAttempts ?? PLAYWRIGHT_RETRY_MAX_ATTEMPTS)) {
      return null;
    }
    if (!isRetryablePlaywrightError(result.reason)) {
      return null;
    }
    await waitMs(delayMs);
    return runAttempt(attempt + 1, delayMs * 2);
  };

  return runAttempt(1, options.delayMs ?? PLAYWRIGHT_RETRY_INITIAL_DELAY_MS);
};

export const fillFirstMatchingField = async (
  page: Page,
  selectors: readonly string[],
  value: string,
): Promise<boolean> => {
  if (value.trim().length === 0) {
    return false;
  }

  const fillResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const result = await withRetry(() =>
      locator.fill(value, { timeout: PLAYWRIGHT_ACTION_TIMEOUT_MS }).then(() => true),
    );
    return result ?? null;
  });
  return fillResult ?? false;
};

export const clickFirstMatchingField = async (
  page: Page,
  selectors: readonly string[],
): Promise<boolean> => {
  const clickResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const result = await withRetry(() =>
      locator.click({ timeout: PLAYWRIGHT_ACTION_TIMEOUT_MS }).then(() => true),
    );
    return result ?? null;
  });
  return clickResult ?? false;
};

const normalizeAnswerText = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/gu, " ");

const isTruthyAnswer = (answer: string): boolean =>
  BOOLEAN_TRUE_ANSWERS.has(normalizeAnswerText(answer));

const isFalsyAnswer = (answer: string): boolean =>
  BOOLEAN_FALSE_ANSWERS.has(normalizeAnswerText(answer));

const readLocatorDescriptors = async (locator: Locator): Promise<LocatorControlDescriptor[]> => {
  const descriptorResult = await settle(
    locator.evaluateAll((elements) =>
      elements.map((element) => {
        const input = element instanceof HTMLInputElement ? element : null;
        const wrappingLabel = element instanceof HTMLElement ? element.closest("label") : null;
        return {
          tagName: element.tagName.toLowerCase(),
          inputType: input?.type?.toLowerCase() ?? "",
          value: input?.value?.trim() ?? "",
          label: (wrappingLabel?.textContent ?? "").trim(),
          text: (element.textContent ?? "").trim(),
          ariaLabel: element.getAttribute("aria-label")?.trim() ?? "",
          placeholder: element.getAttribute("placeholder")?.trim() ?? "",
        };
      }),
    ),
  );

  return descriptorResult.status === "fulfilled" ? descriptorResult.value : [];
};

const findMatchingDescriptorIndex = (
  descriptors: readonly LocatorControlDescriptor[],
  answer: string,
): number | null => {
  const normalizedAnswer = normalizeAnswerText(answer);
  if (normalizedAnswer.length === 0) {
    return null;
  }

  const matchedIndex = descriptors.findIndex((descriptor) => {
    const candidates = [
      descriptor.value,
      descriptor.label,
      descriptor.text,
      descriptor.ariaLabel,
      descriptor.placeholder,
    ]
      .map((candidate) => normalizeAnswerText(candidate))
      .filter((candidate) => candidate.length > 0);

    return candidates.some(
      (candidate) =>
        candidate === normalizedAnswer ||
        candidate.includes(normalizedAnswer) ||
        normalizedAnswer.includes(candidate),
    );
  });

  return matchedIndex >= 0 ? matchedIndex : null;
};

const selectOptionValue = async (locator: Locator, answer: string): Promise<boolean> => {
  const normalizedAnswer = answer.trim();
  if (normalizedAnswer.length === 0) {
    return false;
  }

  const directSelection = await settle(locator.selectOption(normalizedAnswer, { timeout: 5_000 }));
  if (directSelection.status === "fulfilled" && directSelection.value.length > 0) {
    return true;
  }

  const optionResult = await settle(
    locator.evaluate((element) => {
      if (!(element instanceof HTMLSelectElement)) {
        return [];
      }

      return Array.from(element.options).map((option) => ({
        label: option.label.trim(),
        value: option.value.trim(),
        text: option.textContent?.trim() ?? "",
      }));
    }),
  );
  if (optionResult.status === "rejected") {
    return false;
  }

  const normalizedTarget = normalizeAnswerText(answer);
  const matchingOption = optionResult.value.find((option) => {
    const candidates = [option.label, option.value, option.text]
      .map((candidate) => normalizeAnswerText(candidate))
      .filter((candidate) => candidate.length > 0);
    return candidates.some(
      (candidate) =>
        candidate === normalizedTarget ||
        candidate.includes(normalizedTarget) ||
        normalizedTarget.includes(candidate),
    );
  });
  if (!matchingOption) {
    return false;
  }

  const matchedSelection = matchingOption.label
    ? await settle(locator.selectOption({ label: matchingOption.label }, { timeout: 5_000 }))
    : await settle(locator.selectOption(matchingOption.value, { timeout: 5_000 }));

  return matchedSelection.status === "fulfilled" && matchedSelection.value.length > 0;
};

const setCheckboxValue = async (
  locator: Locator,
  descriptors: readonly LocatorControlDescriptor[],
  answer: string,
): Promise<boolean> => {
  if (isTruthyAnswer(answer)) {
    const checkResult = await settle(locator.first().check({ timeout: 5_000 }));
    return checkResult.status === "fulfilled";
  }

  if (isFalsyAnswer(answer)) {
    const uncheckResult = await settle(locator.first().uncheck({ timeout: 5_000 }));
    return uncheckResult.status === "fulfilled";
  }

  const matchedIndex = findMatchingDescriptorIndex(descriptors, answer);
  if (matchedIndex === null) {
    return false;
  }

  const checkResult = await settle(locator.nth(matchedIndex).check({ timeout: 5_000 }));
  return checkResult.status === "fulfilled";
};

const setRadioValue = async (
  locator: Locator,
  descriptors: readonly LocatorControlDescriptor[],
  answer: string,
): Promise<boolean> => {
  const matchedIndex = findMatchingDescriptorIndex(descriptors, answer);
  if (matchedIndex === null) {
    if (!isTruthyAnswer(answer)) {
      return false;
    }
    const fallbackCheckResult = await settle(locator.first().check({ timeout: 5_000 }));
    return fallbackCheckResult.status === "fulfilled";
  }

  const checkResult = await settle(locator.nth(matchedIndex).check({ timeout: 5_000 }));
  return checkResult.status === "fulfilled";
};

const applyAnswerToLocator = async (locator: Locator, answer: string): Promise<boolean> => {
  const descriptors = await readLocatorDescriptors(locator);
  const primaryDescriptor = descriptors[0];
  if (!primaryDescriptor) {
    return false;
  }

  if (primaryDescriptor.tagName === "select") {
    return selectOptionValue(locator.first(), answer);
  }

  if (primaryDescriptor.inputType === "checkbox") {
    return setCheckboxValue(locator, descriptors, answer);
  }

  if (primaryDescriptor.inputType === "radio") {
    return setRadioValue(locator, descriptors, answer);
  }

  const fillResult = await settle(locator.first().fill(answer, { timeout: 5_000 }));
  return fillResult.status === "fulfilled";
};

export const fillFirstMatchingAnswer = async (
  page: Page,
  selectors: readonly string[],
  answer: string,
): Promise<boolean> => {
  if (answer.trim().length === 0) {
    return false;
  }

  const fillResult = await runOnFirstMatchingLocator(page, selectors, async (locator) => {
    const matched = await applyAnswerToLocator(locator, answer);
    return matched ? true : null;
  });

  return fillResult ?? false;
};
