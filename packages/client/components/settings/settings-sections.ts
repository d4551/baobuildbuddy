import type { AppIconName } from "~/components/icons/icon-registry";

export const SETTINGS_SECTION_IDS = [
  "profile",
  "preferences",
  "automation",
  "jobIntelligence",
  "emailDelivery",
  "aiProviders",
  "brand",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export const SETTINGS_DEFAULT_SECTION_ID: SettingsSectionId = "profile";

export const SETTINGS_SECTION_ITEMS = [
  {
    id: "profile",
    labelKey: "settings.profile.title",
    descriptionKey: "settings.profile.subtitle",
    slotName: "profile",
    iconName: "IconDocumentText",
  },
  {
    id: "preferences",
    labelKey: "settings.preferences.title",
    descriptionKey: "settings.preferences.subtitle",
    slotName: "preferences",
    iconName: "IconGlobe",
  },
  {
    id: "automation",
    labelKey: "settings.automation.title",
    descriptionKey: "settings.automation.subtitle",
    slotName: "automation",
    iconName: "IconBolt",
  },
  {
    id: "jobIntelligence",
    labelKey: "settings.jobIntelligence.title",
    descriptionKey: "settings.jobIntelligence.subtitle",
    slotName: "job-intelligence",
    iconName: "IconSearch",
  },
  {
    id: "emailDelivery",
    labelKey: "settings.emailDelivery.title",
    descriptionKey: "settings.emailDelivery.subtitle",
    slotName: "email-delivery",
    iconName: "IconSend",
  },
  {
    id: "aiProviders",
    labelKey: "settings.aiProviders.title",
    descriptionKey: "settings.aiProviders.subtitle",
    slotName: "ai-providers",
    iconName: "IconSparkles",
  },
  {
    id: "brand",
    labelKey: "settings.brand.title",
    descriptionKey: "settings.brand.subtitle",
    slotName: "brand",
    iconName: "IconPencil",
  },
] as const satisfies ReadonlyArray<{
  id: SettingsSectionId;
  labelKey: string;
  descriptionKey?: string;
  slotName: string;
  iconName: AppIconName;
}>;

export type SettingsSectionItem = (typeof SETTINGS_SECTION_ITEMS)[number];

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.some((sectionId) => sectionId === value);
}
