import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  findNavigationItemById,
  normalizeRoutePath,
  resolveLongestMatchingNavItem,
} from "~/constants/navigation";

/**
 * Section breadcrumbs for the app navbar (Dashboard → section → workflow), driven by `NAVIGATION_ITEMS`.
 */
export function useNavbarBreadcrumbs() {
  const route = useRoute();
  const { t } = useI18n();

  const navbarBreadcrumbs = computed(() => {
    const normalized = normalizeRoutePath(route.path);
    if (normalized === "/") {
      return [{ label: t("nav.dashboard") }] as const;
    }

    const match = resolveLongestMatchingNavItem(route.path);
    if (!match) {
      return [
        { label: t("nav.dashboard"), to: APP_ROUTES.dashboard },
        { label: t("nav.breadcrumbUnknown") },
      ] as const;
    }

    if (normalizeRoutePath(match.to) === "/") {
      return [{ label: t("nav.dashboard") }] as const;
    }

    const crumbs: Array<{ label: string; to?: string }> = [
      { label: t("nav.dashboard"), to: APP_ROUTES.dashboard },
    ];

    if (match.parentId) {
      const parent = findNavigationItemById(match.parentId);
      if (parent) {
        crumbs.push({ label: t(parent.labelKey), to: parent.to });
      }
    }

    crumbs.push({ label: t(match.labelKey) });
    return crumbs;
  });

  return { navbarBreadcrumbs };
}
