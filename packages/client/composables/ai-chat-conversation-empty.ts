import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";
import type { Ref } from "vue";
import { computed } from "vue";

/** Empty-state CTA/copy keys for the AI chat conversation panel. */
export const createAiChatConversationEmptyState = (isAiConfigurationIncomplete: Ref<boolean>) => {
  const emptyCtaTo = computed(() =>
    isAiConfigurationIncomplete.value
      ? APP_ROUTE_BUILDERS.settingsSection("aiProviders")
      : APP_ROUTES.aiDashboard,
  );
  const emptyTitleKey = computed(() =>
    isAiConfigurationIncomplete.value ? "aiChatPage.emptyConfigureTitle" : "aiChatPage.emptyTitle",
  );
  const emptyDescriptionKey = computed(() =>
    isAiConfigurationIncomplete.value
      ? "aiChatPage.emptyConfigureDescription"
      : "aiChatPage.emptyDescription",
  );
  const emptyCtaLabelKey = computed(() =>
    isAiConfigurationIncomplete.value ? "aiChatPage.emptyConfigureCta" : "aiChatPage.emptyCta",
  );
  const emptyCtaAriaKey = computed(() =>
    isAiConfigurationIncomplete.value
      ? "aiChatPage.emptyConfigureCtaAria"
      : "aiChatPage.emptyCtaAria",
  );
  return {
    emptyCtaTo,
    emptyTitleKey,
    emptyDescriptionKey,
    emptyCtaLabelKey,
    emptyCtaAriaKey,
  };
};
