import { APP_ROUTES } from "@bao/shared/constants/routes";
import { settle } from "@bao/shared/utils/promise";
import { onMounted, onUnmounted, ref, useRoute, useRouter } from "#imports";
import type { NavigationItem } from "~/constants/navigation";
import { WORKSPACE_OMNI_SEARCH_OPEN_EVENT } from "~/composables/useWorkspaceSearch";
import { createClientLogger } from "~/utils/client-logger";

/**
 * Route shortcut metadata rendered in sidebar and handled globally.
 */
export interface KeyboardRouteShortcut {
  /** Navigation item id. */
  readonly id: NavigationItem["id"];
  /** Prefix key pressed first. */
  readonly prefix: "g";
  /** Route key pressed after the prefix key. */
  readonly key: string;
  /** Route destination path. */
  readonly to: string;
}

/**
 * Canonical keyboard shortcuts for route navigation (g then key).
 * Every sidebar item must be listed here or mark `keyboardOptional` on NavigationItem.
 */
export const KEYBOARD_ROUTE_SHORTCUTS: readonly KeyboardRouteShortcut[] = [
  { id: "dashboard", prefix: "g", key: "d", to: APP_ROUTES.dashboard },
  { id: "jobs", prefix: "g", key: "j", to: APP_ROUTES.jobs },
  { id: "resume", prefix: "g", key: "r", to: APP_ROUTES.resume },
  { id: "cover-letter", prefix: "g", key: "l", to: APP_ROUTES.coverLetter },
  { id: "portfolio", prefix: "g", key: "p", to: APP_ROUTES.portfolio },
  { id: "interview", prefix: "g", key: "i", to: APP_ROUTES.interview },
  { id: "skills", prefix: "g", key: "k", to: APP_ROUTES.skills },
  { id: "studios", prefix: "g", key: "u", to: APP_ROUTES.studios },
  { id: "ai-dashboard", prefix: "g", key: "b", to: APP_ROUTES.aiDashboard },
  { id: "ai-chat", prefix: "g", key: "c", to: APP_ROUTES.aiChat },
  { id: "automation", prefix: "g", key: "m", to: APP_ROUTES.automation },
  { id: "gamification", prefix: "g", key: "g", to: APP_ROUTES.gamification },
  { id: "apiDocs", prefix: "g", key: "a", to: APP_ROUTES.apiDocs },
  { id: "settings", prefix: "g", key: "s", to: APP_ROUTES.settings },
] as const;

const SHORTCUT_PREFIX_TIMEOUT_MS = 900;

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

const shortcutLogger = createClientLogger("keyboard-shortcuts");

async function pushShortcutRoute(
  router: ReturnType<typeof useRouter>,
  targetRoute: string,
): Promise<void> {
  const navigationResult = await settle(router.push(targetRoute));
  if (navigationResult.status === "rejected") {
    shortcutLogger.debug("Shortcut navigation failed (duplicate or guard)", {
      targetRoute,
      err:
        navigationResult.reason instanceof Error
          ? navigationResult.reason.message
          : String(navigationResult.reason),
    });
  }
}

/** Enterprise command palette: Cmd/Ctrl+K or Cmd/Ctrl+P opens workspace OmniSearch. */
function isOpenSearchShortcut(event: KeyboardEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) {
    return false;
  }
  const key = event.key.toLowerCase();
  return key === "k" || key === "p";
}

/** Chat composer focus: Cmd/Ctrl+Shift+K (distinct from search). */
function isFocusChatShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    !event.altKey &&
    event.key.toLowerCase() === "k"
  );
}

function hasBlockedModifier(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey;
}

function createKeyDownHandler(input: {
  route: ReturnType<typeof useRoute>;
  router: ReturnType<typeof useRouter>;
  routeBySuffixKey: ReadonlyMap<string, string>;
  pendingPrefix: ReturnType<typeof ref<KeyboardRouteShortcut["prefix"] | null>>;
  resetPrefix: () => void;
  armPrefix: () => void;
  openSearchShortcut: () => void;
  focusChatShortcut: () => void;
}): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent): void => {
    if (isOpenSearchShortcut(event)) {
      event.preventDefault();
      input.openSearchShortcut();
      return;
    }

    if (isFocusChatShortcut(event)) {
      event.preventDefault();
      input.focusChatShortcut();
      return;
    }

    if (isEditableTarget(event.target) || hasBlockedModifier(event)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (input.pendingPrefix.value === "g") {
      const targetRoute = input.routeBySuffixKey.get(key);
      input.resetPrefix();
      if (targetRoute && input.route.path !== targetRoute) {
        event.preventDefault();
        pushShortcutRoute(input.router, targetRoute).then(undefined, () => undefined);
      }
      return;
    }

    if (key === "g") {
      input.armPrefix();
    }
  };
}

/**
 * Registers global keyboard shortcuts for power-user navigation.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const route = useRoute();
  const pendingPrefix = ref<KeyboardRouteShortcut["prefix"] | null>(null);
  let prefixTimer: ReturnType<typeof setTimeout> | null = null;
  const routeBySuffixKey = new Map(
    KEYBOARD_ROUTE_SHORTCUTS.map((shortcut) => [shortcut.key, shortcut.to]),
  );

  const resetPrefix = (): void => {
    pendingPrefix.value = null;
    if (prefixTimer) {
      clearTimeout(prefixTimer);
      prefixTimer = null;
    }
  };
  const armPrefix = (): void => {
    pendingPrefix.value = "g";
    if (prefixTimer) {
      clearTimeout(prefixTimer);
    }
    prefixTimer = setTimeout(resetPrefix, SHORTCUT_PREFIX_TIMEOUT_MS);
  };
  const openSearchShortcut = (): void => {
    window.dispatchEvent(new CustomEvent(WORKSPACE_OMNI_SEARCH_OPEN_EVENT));
  };
  const focusChatShortcut = (): void => {
    window.dispatchEvent(new CustomEvent("bao:focus-chat"));
  };

  const onKeyDown = createKeyDownHandler({
    route,
    router,
    routeBySuffixKey,
    pendingPrefix,
    resetPrefix,
    armPrefix,
    openSearchShortcut,
    focusChatShortcut,
  });

  onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
  });
  onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown);
    resetPrefix();
  });
}
