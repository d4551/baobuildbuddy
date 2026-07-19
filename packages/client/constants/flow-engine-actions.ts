import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { FlowActionDefinition, FlowActionId } from "./flow-engine-types";

/**
 * Canonical action registry consumed by the flow engine.
 */
export const FLOW_ACTION_DEFINITIONS: Record<FlowActionId, FlowActionDefinition> = {
  setup: {
    id: "setup",
    to: APP_ROUTES.setup,
    labelKey: "dashboard.setupCtaLabel",
    iconPath:
      "M12 4v16m8-8H4m13-7l-1.414 1.414M6.414 17.586 5 19m14-1.414L17.586 19M6.414 6.414 5 5",
  },
  jobs: {
    id: "jobs",
    to: APP_ROUTES.jobs,
    labelKey: "dashboard.pipeline.steps.search",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  resume: {
    id: "resume",
    to: APP_ROUTES.resume,
    labelKey: "dashboard.pipeline.steps.customize",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  coverLetter: {
    id: "coverLetter",
    to: APP_ROUTES.coverLetter,
    labelKey: "resumePage.completion.quickActions.coverLetter",
    iconPath:
      "M7 8h10M7 12h8m-8 4h6m-5 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  portfolio: {
    id: "portfolio",
    to: APP_ROUTES.portfolio,
    labelKey: "resumePage.completion.quickActions.portfolio",
    iconPath:
      "M4 7h16M4 12h16M4 17h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  },
  automationScraper: {
    id: "automationScraper",
    to: APP_ROUTES.automationScraper,
    labelKey: "dashboard.pipeline.steps.scrape",
    iconPath: "M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h3v3H7v-3zm5 0h5v1h-5v-1zm0 2h5v1h-5v-1z",
  },
  automationApply: {
    id: "automationApply",
    to: APP_ROUTES.automationJobApply,
    labelKey: "dashboard.pipeline.steps.apply",
    iconPath: "M12 19l9-7-9-7v4.5C7 9.5 4 11.5 3 16c2-2 4.5-3 9-3V19z",
  },
  automationRuns: {
    id: "automationRuns",
    to: APP_ROUTES.automationRuns,
    labelKey: "automation.hub.viewRunsButton",
    iconPath: "M13 3v10h8m-8-10a9 9 0 100 18 9 9 0 000-18zM5 12h4m6 0h4M12 7v2m0 6v2",
  },
  interview: {
    id: "interview",
    to: APP_ROUTES.interview,
    labelKey: "dashboard.quickActions.actions.practiceInterview",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  aiChat: {
    id: "aiChat",
    to: APP_ROUTES.aiChat,
    labelKey: "dashboard.quickActions.actions.aiChat",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
};
