export const AUTOMATION_SCRAPER_SECTION_IDS = ["providers", "jobs"] as const;

export type AutomationScraperSectionId = (typeof AUTOMATION_SCRAPER_SECTION_IDS)[number];

export interface AutomationScraperSectionItem {
  readonly id: AutomationScraperSectionId;
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly slotName: AutomationScraperSectionId;
  readonly iconName: "IconBolt" | "IconDocumentText";
}

export const AUTOMATION_SCRAPER_SECTION_ITEMS: readonly AutomationScraperSectionItem[] = [
  {
    id: "providers",
    labelKey: "automation.scraper.sections.providers.label",
    descriptionKey: "automation.scraper.sections.providers.description",
    slotName: "providers",
    iconName: "IconBolt",
  },
  {
    id: "jobs",
    labelKey: "automation.scraper.sections.jobs.label",
    descriptionKey: "automation.scraper.sections.jobs.description",
    slotName: "jobs",
    iconName: "IconDocumentText",
  },
] as const;

export const AUTOMATION_SCRAPER_DEFAULT_SECTION_ID: AutomationScraperSectionId = "providers";

export function isAutomationScraperSectionId(value: string): value is AutomationScraperSectionId {
  return AUTOMATION_SCRAPER_SECTION_IDS.some((sectionId) => sectionId === value);
}
