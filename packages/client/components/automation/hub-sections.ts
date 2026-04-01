export const AUTOMATION_HUB_SECTIONS = {
  overview: {
    id: "overview",
    labelKey: "automation.hub.sections.overview.label",
    descriptionKey: "automation.hub.sections.overview.description",
    iconName: "IconInfoCircle",
  },
  readiness: {
    id: "readiness",
    labelKey: "automation.hub.sections.readiness.label",
    descriptionKey: "automation.hub.sections.readiness.description",
    iconName: "IconCheckCircle",
  },
  workflows: {
    id: "workflows",
    labelKey: "automation.hub.sections.workflows.label",
    descriptionKey: "automation.hub.sections.workflows.description",
    iconName: "IconBolt",
  },
} as const;

export type AutomationHubSectionId = keyof typeof AUTOMATION_HUB_SECTIONS;

export type AutomationHubSectionItem = (typeof AUTOMATION_HUB_SECTIONS)[AutomationHubSectionId];

export const AUTOMATION_HUB_SECTION_ITEMS = [
  AUTOMATION_HUB_SECTIONS.overview,
  AUTOMATION_HUB_SECTIONS.readiness,
  AUTOMATION_HUB_SECTIONS.workflows,
] as const satisfies readonly AutomationHubSectionItem[];

export const AUTOMATION_HUB_DEFAULT_SECTION_ID: AutomationHubSectionId = "overview";

export function isAutomationHubSectionId(value: string): value is AutomationHubSectionId {
  return value in AUTOMATION_HUB_SECTIONS;
}
