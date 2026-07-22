import type { AppTranslationSchema } from "~/locales/en-US";

type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * Translation keys available for navigation labels.
 */
export type NavigationLabelKey = `nav.${StringKeyOf<AppTranslationSchema["nav"]>}`;

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
  /**
   * Extra path prefixes that light this dock item (section wayfinding).
   * Example: ai-chat matches APP_ROUTES.aiDashboard via APP_ROUTES.ai.
   */
  readonly dockMatchPrefixes?: readonly string[];
  /**
   * Optional parent nav id for secondary workflow routes (breadcrumb hierarchy).
   * Secondary items keep includeInSidebar/includeInDock false but remain discoverable.
   */
  readonly parentId?: string;
}
