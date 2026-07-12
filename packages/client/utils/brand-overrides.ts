import type { AvailableLocale } from "~/constants/i18n-catalog";
import { I18N_MESSAGE_CATALOG } from "~/constants/i18n-catalog";

type MessageNode = Record<string, unknown>;

function cloneMessageNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setByPath(target: MessageNode, path: string, value: string): void {
  const segments = path
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return;
  }

  let cursor: MessageNode = target;
  for (const segment of segments.slice(0, -1)) {
    const next = cursor[segment];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      cursor[segment] = {};
    }
    cursor = next as Record<string, unknown>;
  }

  const leafKey = segments[segments.length - 1];
  if (leafKey) {
    cursor[leafKey] = value;
  }
}

/**
 * Builds a locale catalog with brand copy overrides applied to dot-delimited message keys.
 *
 * @param locale Active locale key.
 * @param overrides White-label copy overrides keyed by locale-message path.
 * @returns Localized message tree with overrides applied.
 */
export function buildBrandedLocaleMessages(
  locale: AvailableLocale,
  overrides: Record<string, string>,
): MessageNode {
  const baseMessages: MessageNode = cloneMessageNode(I18N_MESSAGE_CATALOG[locale]);
  for (const [messageKey, messageValue] of Object.entries(overrides)) {
    setByPath(baseMessages, messageKey, messageValue);
  }
  return baseMessages;
}
