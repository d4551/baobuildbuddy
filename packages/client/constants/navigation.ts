import { APP_ROUTES } from "@bao/shared";
import type { AppTranslationSchema } from "~/locales/en-US";

/**
 * Translation keys available for navigation labels.
 */
type NavigationLabelKey = `nav.${keyof AppTranslationSchema["nav"] & string}`;

/**
 * Shared navigation item contract for app chrome components.
 */
export interface NavigationItem {
  /** Stable identifier for keyed rendering and analytics events. */
  readonly id: string;
  /** Translation key for the human-readable navigation label. */
  readonly labelKey: NavigationLabelKey;
  /** Target route path. */
  readonly to: string;
  /** Heroicon path data used by sidebar and dock icon renderers. */
  readonly iconPath: string;
  /** Whether this item appears in the desktop sidebar. */
  readonly includeInSidebar: boolean;
  /** Whether this item appears in the mobile dock navigation. */
  readonly includeInDock: boolean;
}

/**
 * Canonical app navigation registry used by sidebar and dock.
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    iconPath:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    to: APP_ROUTES.dashboard,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "jobs",
    labelKey: "nav.jobs",
    iconPath:
      "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.jobs,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "resume",
    labelKey: "nav.resume",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    to: APP_ROUTES.resume,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "cover-letter",
    labelKey: "nav.coverLetter",
    iconPath:
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.coverLetter,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "portfolio",
    labelKey: "nav.portfolio",
    iconPath:
      "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    to: APP_ROUTES.portfolio,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "interview",
    labelKey: "nav.interview",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    to: APP_ROUTES.interview,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "skills",
    labelKey: "nav.skills",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    to: APP_ROUTES.skills,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "studios",
    labelKey: "nav.studios",
    iconPath:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    to: APP_ROUTES.studios,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "ai-chat",
    labelKey: "nav.aiChat",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    to: APP_ROUTES.aiChat,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "automation",
    labelKey: "nav.automation",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automation,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "gamification",
    labelKey: "nav.gamification",
    iconPath:
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    to: APP_ROUTES.gamification,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    iconPath:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    to: APP_ROUTES.settings,
    includeInSidebar: true,
    includeInDock: true,
  },
] as const;

/**
 * Returns navigation items rendered in the desktop sidebar.
 *
 * @returns Sidebar navigation item collection.
 */
export function getSidebarNavigationItems(): readonly NavigationItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.includeInSidebar);
}

/**
 * Returns navigation items rendered in the mobile dock.
 *
 * @returns Mobile dock navigation item collection.
 */
export function getDockNavigationItems(): readonly NavigationItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.includeInDock);
}

/**
 * Determines if a route should be considered active for navigation UI.
 *
 * @param currentPath Current route path.
 * @param targetPath Navigation target path.
 * @returns True when the target matches exactly or as a parent prefix.
 */
export function isRouteActive(currentPath: string, targetPath: string): boolean {
  return currentPath === targetPath || (targetPath !== "/" && currentPath.startsWith(targetPath));
}
