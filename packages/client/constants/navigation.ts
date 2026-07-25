import { APP_ROUTES } from "@bao/shared/constants/routes";
import type { AppTranslationSchema } from "~/locales/en-US";
import { NAVIGATION_SECONDARY_ITEMS } from "./navigation-secondary";

type StringKeyOf<T> = Extract<keyof T, string>;

const PATH_SPLIT_PATTERN = /[?#]/u;
const MULTIPLE_SLASH_PATTERN = /\/{2,}/gu;

/**
 * Translation keys available for navigation labels.
 */
type NavigationLabelKey = `nav.${StringKeyOf<AppTranslationSchema["nav"]>}`;

/** Industry IA groups for sidebar sections. */
export const NAVIGATION_GROUP_IDS = ["work", "create", "intelligence", "system"] as const;
export type NavigationGroupId = (typeof NAVIGATION_GROUP_IDS)[number];

export type NavigationGroupLabelKey = `nav.groups.${NavigationGroupId}`;

export const NAVIGATION_GROUPS: readonly {
  readonly id: NavigationGroupId;
  readonly labelKey: NavigationGroupLabelKey;
}[] = [
  { id: "work", labelKey: "nav.groups.work" },
  { id: "create", labelKey: "nav.groups.create" },
  { id: "intelligence", labelKey: "nav.groups.intelligence" },
  { id: "system", labelKey: "nav.groups.system" },
] as const;

/** Canonical dock destination ids (Home / Work / Create / AI / System). */
export const DOCK_NAVIGATION_IDS = [
  "dashboard",
  "jobs",
  "resume",
  "ai-chat",
  "settings",
] as const;

/**
 * Shared navigation item contract for app chrome components.
 */
export interface NavigationItem {
  /** Stable identifier for keyed rendering and analytics events. */
  readonly id: string;
  /** IA group for sidebar sectioning. */
  readonly groupId: NavigationGroupId;
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
  /**
   * Extra path prefixes that light this dock item (section wayfinding).
   * Example: ai-chat matches APP_ROUTES.aiDashboard via APP_ROUTES.ai.
   */
  readonly dockMatchPrefixes?: readonly string[];
  /**
   * When true, item is exempt from g-then-key shortcut coverage
   * (reachable via another shortcut/surface).
   */
  readonly keyboardOptional?: boolean;
  /**
   * Optional parent nav id for secondary workflow routes (breadcrumb hierarchy).
   * Secondary items keep includeInSidebar/includeInDock false but remain discoverable.
   */
  readonly parentId?: string;
}

/**
 * Canonical app navigation registry used by sidebar and dock.
 */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    id: "dashboard",
    groupId: "work",
    labelKey: "nav.dashboard",
    iconPath:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    to: APP_ROUTES.dashboard,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "jobs",
    groupId: "work",
    labelKey: "nav.jobs",
    iconPath:
      "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.jobs,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "studios",
    groupId: "work",
    labelKey: "nav.studios",
    iconPath:
      "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    to: APP_ROUTES.studios,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "automation",
    groupId: "work",
    labelKey: "nav.automation",
    iconPath:
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.automation,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "resume",
    groupId: "create",
    labelKey: "nav.resume",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    to: APP_ROUTES.resume,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "cover-letter",
    groupId: "create",
    labelKey: "nav.coverLetter",
    iconPath:
      "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    to: APP_ROUTES.coverLetter,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "portfolio",
    groupId: "create",
    labelKey: "nav.portfolio",
    iconPath:
      "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    to: APP_ROUTES.portfolio,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "interview",
    groupId: "create",
    labelKey: "nav.interview",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    to: APP_ROUTES.interview,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "skills",
    groupId: "create",
    labelKey: "nav.skills",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    to: APP_ROUTES.skills,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "ai-chat",
    groupId: "intelligence",
    labelKey: "nav.aiChat",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    to: APP_ROUTES.aiChat,
    includeInSidebar: true,
    includeInDock: true,
    dockMatchPrefixes: [APP_ROUTES.ai],
  },
  {
    id: "ai-dashboard",
    groupId: "intelligence",
    labelKey: "nav.aiDashboard",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    to: APP_ROUTES.aiDashboard,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "settings",
    groupId: "system",
    labelKey: "nav.settings",
    iconPath:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    to: APP_ROUTES.settings,
    includeInSidebar: true,
    includeInDock: true,
  },
  {
    id: "gamification",
    groupId: "system",
    labelKey: "nav.gamification",
    iconPath:
      "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    to: APP_ROUTES.gamification,
    includeInSidebar: true,
    includeInDock: false,
  },
  {
    id: "apiDocs",
    groupId: "system",
    labelKey: "nav.apiDocs",
    iconPath:
      "M19 2H9a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-7-7z M9 2h5l5 5v13a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 01 1-1z",
    to: APP_ROUTES.apiDocs,
    includeInSidebar: true,
    includeInDock: false,
  },
  ...NAVIGATION_SECONDARY_ITEMS,
] as const;

/**
 * Returns navigation items rendered in the desktop sidebar (registry order).
 */
export function getSidebarNavigationItems(): readonly NavigationItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.includeInSidebar);
}

/**
 * Sidebar items bucketed by IA group (empty groups omitted).
 */
export function getSidebarNavigationGroups(): readonly {
  readonly id: NavigationGroupId;
  readonly labelKey: NavigationGroupLabelKey;
  readonly items: readonly NavigationItem[];
}[] {
  return NAVIGATION_GROUPS.flatMap((group) => {
    const items = NAVIGATION_ITEMS.filter(
      (item) => item.includeInSidebar && item.groupId === group.id,
    );
    return items.length > 0 ? [{ ...group, items }] : [];
  });
}

/**
 * Apple HIG–aligned mobile dock cap (3–5 primary destinations).
 */
export const MOBILE_DOCK_MAX_ITEMS = 5;

/**
 * Returns navigation items rendered in the mobile dock (canonical order).
 */
export function getDockNavigationItems(): readonly NavigationItem[] {
  const byId = new Map(NAVIGATION_ITEMS.map((item) => [item.id, item]));
  return DOCK_NAVIGATION_IDS.flatMap((id) => {
    const item = byId.get(id);
    return item?.includeInDock ? [item] : [];
  }).slice(0, MOBILE_DOCK_MAX_ITEMS);
}

/**
 * Normalizes route paths for deterministic active-route matching.
 */
export function normalizeRoutePath(pathValue: string): string {
  const [pathWithoutQueryRaw] = pathValue.split(PATH_SPLIT_PATTERN);
  const pathWithoutQuery = pathWithoutQueryRaw ?? "";
  const prefixed = pathWithoutQuery.startsWith("/") ? pathWithoutQuery : `/${pathWithoutQuery}`;
  const collapsed = prefixed.replace(MULTIPLE_SLASH_PATTERN, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }
  return collapsed || "/";
}

const toPathSegments = (pathValue: string): string[] =>
  normalizeRoutePath(pathValue)
    .split("/")
    .filter((segment) => segment.length > 0);

const isDynamicSegment = (segment: string): boolean =>
  segment.startsWith(":") || (segment.startsWith("[") && segment.endsWith("]"));

const segmentMatches = (targetSegment: string, currentSegment: string): boolean =>
  targetSegment === currentSegment || isDynamicSegment(targetSegment);

/**
 * Determines if a route should be considered active for navigation UI.
 */
export function isRouteActive(currentPath: string, targetPath: string): boolean {
  const normalizedCurrentPath = normalizeRoutePath(currentPath);
  const normalizedTargetPath = normalizeRoutePath(targetPath);

  if (normalizedCurrentPath === normalizedTargetPath) {
    return true;
  }

  if (normalizedTargetPath === "/") {
    return normalizedCurrentPath === "/";
  }

  const currentSegments = toPathSegments(normalizedCurrentPath);
  const targetSegments = toPathSegments(normalizedTargetPath);
  if (targetSegments.length === 0 || currentSegments.length < targetSegments.length) {
    return false;
  }

  for (let index = 0; index < targetSegments.length; index += 1) {
    const targetSegment = targetSegments[index];
    const currentSegment = currentSegments[index];
    if (!(targetSegment && currentSegment && segmentMatches(targetSegment, currentSegment))) {
      return false;
    }
  }

  return true;
}

/**
 * Dock / section wayfinding: exact/parent match on `to`, plus optional prefix aliases.
 */
export function isDockRouteActive(currentPath: string, item: NavigationItem): boolean {
  if (isRouteActive(currentPath, item.to)) {
    return true;
  }
  const prefixes = item.dockMatchPrefixes;
  if (!prefixes || prefixes.length === 0) {
    return false;
  }
  const normalizedCurrentPath = normalizeRoutePath(currentPath);
  return prefixes.some((prefix) => {
    const normalizedPrefix = normalizeRoutePath(prefix);
    if (normalizedPrefix === "/") {
      return normalizedCurrentPath === "/";
    }
    return (
      normalizedCurrentPath === normalizedPrefix ||
      normalizedCurrentPath.startsWith(`${normalizedPrefix}/`)
    );
  });
}

/**
 * Resolves the most specific sidebar nav item for the current path (longest matching `to`).
 */
export function resolveLongestMatchingSidebarNavItem(path: string): NavigationItem | null {
  const matches = NAVIGATION_ITEMS.filter(
    (item) => item.includeInSidebar && isRouteActive(path, item.to),
  );
  if (matches.length === 0) {
    return null;
  }
  return matches.reduce((best, item) =>
    normalizeRoutePath(item.to).length > normalizeRoutePath(best.to).length ? item : best,
  );
}
