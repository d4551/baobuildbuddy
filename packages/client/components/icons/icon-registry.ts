import { resolveComponent, type Component } from "vue";

export const APP_ICON_COMPONENTS = {
  IconBolt: "IconBolt",
  IconCheckCircle: "IconCheckCircle",
  IconDocumentText: "IconDocumentText",
  IconGlobe: "IconGlobe",
  IconInfoCircle: "IconInfoCircle",
  IconPencil: "IconPencil",
  IconRefresh: "IconRefresh",
  IconSearch: "IconSearch",
  IconSend: "IconSend",
  IconSparkles: "IconSparkles",
} as const;

export type AppIconName = keyof typeof APP_ICON_COMPONENTS;

/**
 * Resolves a registered app icon name to a Vue component (Nuxt auto-import).
 */
export function resolveAppIconComponent(iconName: AppIconName): Component | string {
  return resolveComponent(APP_ICON_COMPONENTS[iconName]);
}
