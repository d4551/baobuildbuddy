import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import type { AvailableLocale } from "~/constants/i18n-catalog";
import { I18N_MESSAGE_CATALOG } from "~/constants/i18n-catalog";

type MessageNode = JsonObject;

function cloneMessageNode<T>(value: T): T {
  return structuredClone(value);
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
    const next: JsonValue | undefined = cursor[segment];
    if (!isRecord(next)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as MessageNode;
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
