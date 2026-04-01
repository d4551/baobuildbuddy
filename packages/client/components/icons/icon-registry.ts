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

export function resolveAppIconComponent(
  iconName: AppIconName,
): (typeof APP_ICON_COMPONENTS)[AppIconName] {
  return APP_ICON_COMPONENTS[iconName];
}
