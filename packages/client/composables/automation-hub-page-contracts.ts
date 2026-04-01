import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { AutomationVisualIconName } from "~/components/automation/automation-visuals";
import type { FlowActionId } from "~/constants/flow-engine";

export type AutomationHubUiState = "idle" | "loading" | "error" | "success";
export type AutomationHubCardId = "scraper" | "jobApply" | "emailResponse" | "runHistory";

export interface AutomationHubCard {
  readonly id: AutomationHubCardId;
  readonly flowActionId: FlowActionId | null;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly buttonKey: string;
  readonly to: string;
  readonly iconName: AutomationVisualIconName;
}

export type AutomationHubTranslate = (key: string) => string;

export const BASE_AUTOMATION_CARDS: readonly AutomationHubCard[] = [
  {
    id: "scraper",
    flowActionId: "automationScraper",
    titleKey: "automation.hub.cards.scraper.title",
    descriptionKey: "automation.hub.cards.scraper.description",
    buttonKey: "automation.hub.cards.scraper.button",
    to: APP_ROUTES.automationScraper,
    iconName: "IconSearch",
  },
  {
    id: "jobApply",
    flowActionId: "automationApply",
    titleKey: "automation.hub.cards.jobApply.title",
    descriptionKey: "automation.hub.cards.jobApply.description",
    buttonKey: "automation.hub.cards.jobApply.button",
    to: APP_ROUTES.automationJobApply,
    iconName: "IconBolt",
  },
  {
    id: "emailResponse",
    flowActionId: null,
    titleKey: "automation.hub.cards.emailResponse.title",
    descriptionKey: "automation.hub.cards.emailResponse.description",
    buttonKey: "automation.hub.cards.emailResponse.button",
    to: APP_ROUTES.automationEmail,
    iconName: "IconSend",
  },
  {
    id: "runHistory",
    flowActionId: "automationRuns",
    titleKey: "automation.hub.cards.runHistory.title",
    descriptionKey: "automation.hub.cards.runHistory.description",
    buttonKey: "automation.hub.cards.runHistory.button",
    to: APP_ROUTES.automationRuns,
    iconName: "IconDocumentText",
  },
] as const;

export const resolveOrderedCardIds = (
  actionIds: readonly FlowActionId[],
): AutomationHubCardId[] => {
  const orderedCardIds: AutomationHubCardId[] = [];
  for (const actionId of actionIds) {
    const cardId =
      actionId === "automationScraper"
        ? "scraper"
        : actionId === "automationApply"
          ? "jobApply"
          : actionId === "automationRuns"
            ? "runHistory"
            : null;
    if (!cardId || orderedCardIds.includes(cardId)) {
      continue;
    }
    orderedCardIds.push(cardId);
  }

  return orderedCardIds;
};
