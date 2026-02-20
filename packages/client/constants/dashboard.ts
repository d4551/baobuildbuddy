import { APP_BRAND } from "@bao/shared";

/**
 * Primary stat identifiers rendered on dashboard hero tiles.
 */
export type DashboardStatKey = "savedJobs" | "resumeCount" | "interviewSessionCount";

/**
 * Dashboard quick-action configuration model.
 */
export interface DashboardQuickAction {
  /** Stable item identifier for keyed rendering and tracking. */
  readonly id: string;
  /** Action label displayed in the button. */
  readonly label: string;
  /** Route destination. */
  readonly to: string;
  /** SVG path for the icon. */
  readonly iconPath: string;
}

/**
 * Dashboard primary stat card metadata.
 */
export interface DashboardStatCard {
  /** Stable identifier for rendering and testing hooks. */
  readonly id: string;
  /** Human-readable stat title. */
  readonly title: string;
  /** Destination route when card is clicked. */
  readonly to: string;
  /** Associated dashboard stat key. */
  readonly statKey: DashboardStatKey;
  /** SVG path for icon rendering. */
  readonly iconPath: string;
  /** Accent utility class for icon and CTA color. */
  readonly accentClass: string;
  /** Call-to-action helper text. */
  readonly ctaLabel: string;
}

/**
 * Static copy used by the dashboard page.
 */
export const DASHBOARD_COPY = {
  pageTitle: "Dashboard",
  seoDescription:
    "Track opportunities, resume progress, interview practice, and activity signals in one operational dashboard.",
  welcomeDescription: "Your AI-powered career operating system for the video game industry.",
  emptyStateTitle: "Kick off your career workspace",
  emptyStateDescription:
    "Complete setup, add your first resume, and start tracking opportunities to populate this dashboard.",
  recentActivityTitle: "Recent Activity",
  recentActivityEmptyLabel: "No recent activity",
  dailyChallengeTitle: "Daily Challenge",
  quickActionsTitle: "Quick Actions",
  levelLabel: "Level",
  streakLabel: "day streak",
  retryButtonLabel: "Retry",
  loadErrorFallback: "Failed to load dashboard data",
  setupCtaLabel: "Complete Setup",
  metricsSummaryLabel: `${APP_BRAND.name} snapshot`,
} as const;

/**
 * useAsyncData key for SSR dashboard bootstrap.
 */
export const DASHBOARD_ASYNC_DATA_KEY = "dashboard-bootstrap";

/**
 * Maximum number of recent activity entries shown on dashboard.
 */
export const DASHBOARD_RECENT_ACTIVITY_LIMIT = 5;

/**
 * Time conversion constants for relative timestamps.
 */
export const DASHBOARD_TIME_CONSTANTS = {
  millisecondsPerMinute: 60_000,
  millisecondsPerHour: 3_600_000,
  millisecondsPerDay: 86_400_000,
} as const;

/**
 * Shared card configuration for top-level dashboard metrics.
 */
export const DASHBOARD_STAT_CARDS: readonly DashboardStatCard[] = [
  {
    id: "saved-jobs",
    title: "Saved Jobs",
    to: "/jobs",
    statKey: "savedJobs",
    iconPath:
      "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    accentClass: "text-primary",
    ctaLabel: "Open jobs workspace",
  },
  {
    id: "resumes",
    title: "Resumes",
    to: "/resume",
    statKey: "resumeCount",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    accentClass: "text-secondary",
    ctaLabel: "Edit resume library",
  },
  {
    id: "interview-sessions",
    title: "Interview Sessions",
    to: "/interview",
    statKey: "interviewSessionCount",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    accentClass: "text-accent",
    ctaLabel: "Practice interview flow",
  },
] as const;

/**
 * Quick actions rendered in the dashboard footer section.
 */
export const DASHBOARD_QUICK_ACTIONS: readonly DashboardQuickAction[] = [
  {
    id: "jobs",
    label: "Browse Jobs",
    to: "/jobs",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    id: "resume",
    label: "Build Resume",
    to: "/resume",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "interview",
    label: "Practice Interview",
    to: "/interview",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    id: "ai-chat",
    label: `Chat with ${APP_BRAND.assistantName}`,
    to: "/ai/chat",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
] as const;

/**
 * Builds the personalized dashboard welcome heading.
 *
 * @param profileName User profile display name.
 * @returns Welcome heading copy.
 */
export function getWelcomeHeading(profileName: string | null | undefined): string {
  return profileName ? `Welcome, ${profileName}!` : "Welcome!";
}

/**
 * Maps activity categories to emoji glyphs for quick scanning.
 *
 * @param activityType Activity category value.
 * @returns Emoji icon text.
 */
export function getDashboardActivityEmoji(activityType: string): string {
  if (activityType.includes("job")) return "📝";
  if (activityType.includes("resume")) return "📄";
  if (activityType.includes("interview")) return "🎤";
  if (activityType.includes("portfolio")) return "🧩";
  return "⚡";
}
