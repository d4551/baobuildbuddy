import type { NavigationItem } from "~/constants/navigation";
import { APP_ROUTES } from "@bao/shared";

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
 * Canonical keyboard shortcuts for route navigation.
 */
export const KEYBOARD_ROUTE_SHORTCUTS: readonly KeyboardRouteShortcut[] = [
  { id: "dashboard", prefix: "g", key: "d", to: APP_ROUTES.dashboard },
  { id: "jobs", prefix: "g", key: "j", to: APP_ROUTES.jobs },
  { id: "resume", prefix: "g", key: "r", to: APP_ROUTES.resume },
  { id: "interview", prefix: "g", key: "i", to: APP_ROUTES.interview },
  { id: "settings", prefix: "g", key: "s", to: APP_ROUTES.settings },
] as const;

const SHORTCUT_PREFIX_TIMEOUT_MS = 900;

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

  const resetPrefix = () => {
    pendingPrefix.value = null;
    if (prefixTimer) {
      clearTimeout(prefixTimer);
      prefixTimer = null;
    }
  };

  const armPrefix = () => {
    pendingPrefix.value = "g";
    if (prefixTimer) {
      clearTimeout(prefixTimer);
    }
    prefixTimer = setTimeout(() => {
      pendingPrefix.value = null;
      prefixTimer = null;
    }, SHORTCUT_PREFIX_TIMEOUT_MS);
  };

  const focusChatShortcut = () => {
    window.dispatchEvent(new CustomEvent("bao:focus-chat"));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    const isEditableTarget =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      focusChatShortcut();
      return;
    }

    if (isEditableTarget || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (pendingPrefix.value === "g") {
      const targetRoute = routeBySuffixKey.get(key);
      resetPrefix();
      if (targetRoute && route.path !== targetRoute) {
        event.preventDefault();
        router.push(targetRoute);
      }
      return;
    }

    if (key === "g") {
      armPrefix();
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown);
    resetPrefix();
  });
}
