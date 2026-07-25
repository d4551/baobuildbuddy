import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { NavigationItem, NavigationGroupId } from "./navigation";

/**
 * Secondary workflow routes — exact nav coverage + breadcrumb leaves.
 */
export const NAVIGATION_SECONDARY_ITEMS: readonly NavigationItem[] = [
  {
    id: "resume-build",
    labelKey: "nav.resumeBuild",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    to: APP_ROUTES.resumeBuild,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "resume",
  },
  {
    id: "resume-preview",
    labelKey: "nav.resumePreview",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    to: APP_ROUTES.resumePreview,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "resume",
  },
  {
    id: "portfolio-preview",
    labelKey: "nav.portfolioPreview",
    iconPath:
      "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    to: APP_ROUTES.portfolioPreview,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "portfolio",
  },
  {
    id: "interview-history",
    labelKey: "nav.interviewHistory",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    to: APP_ROUTES.interviewHistory,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "interview",
  },
  {
    id: "interview-session",
    labelKey: "nav.interviewSession",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    to: APP_ROUTES.interviewSession,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "interview",
  },
  {
    id: "skills-pathways",
    labelKey: "nav.skillsPathways",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    to: APP_ROUTES.skillsPathways,
    groupId: "create" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "skills",
  },
  {
    id: "studios-analytics",
    labelKey: "nav.studiosAnalytics",
    iconPath:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    to: APP_ROUTES.studiosAnalytics,
    groupId: "work" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "studios",
  },
  {
    id: "automation-job-apply",
    labelKey: "nav.automationJobApply",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automationJobApply,
    groupId: "system" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "automation",
  },
  {
    id: "automation-scraper",
    labelKey: "nav.automationScraper",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automationScraper,
    groupId: "system" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "automation",
  },
  {
    id: "automation-email",
    labelKey: "nav.automationEmail",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automationEmail,
    groupId: "system" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "automation",
  },
  {
    id: "automation-runs",
    labelKey: "nav.automationRuns",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automationRuns,
    groupId: "system" as NavigationGroupId,
    includeInSidebar: false,
    includeInDock: false,
    parentId: "automation",
  },
] as const;
