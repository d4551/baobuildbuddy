import type { Component } from "vue";
import IconBolt from "./IconBolt.vue";
import IconCheckCircle from "./IconCheckCircle.vue";
import IconDocumentText from "./IconDocumentText.vue";
import IconGlobe from "./IconGlobe.vue";
import IconInfoCircle from "./IconInfoCircle.vue";
import IconPencil from "./IconPencil.vue";
import IconRefresh from "./IconRefresh.vue";
import IconSearch from "./IconSearch.vue";
import IconSend from "./IconSend.vue";
import IconSparkles from "./IconSparkles.vue";

export const APP_ICON_COMPONENTS = {
  IconBolt,
  IconCheckCircle,
  IconDocumentText,
  IconGlobe,
  IconInfoCircle,
  IconPencil,
  IconRefresh,
  IconSearch,
  IconSend,
  IconSparkles,
} as const;

export type AppIconName = keyof typeof APP_ICON_COMPONENTS;

/**
 * Resolves a registered app icon name to a Vue component (Nuxt auto-import).
 */
export function resolveAppIconComponent(iconName: AppIconName): Component {
  return APP_ICON_COMPONENTS[iconName];
}
