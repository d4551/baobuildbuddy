import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { normalizeRoutePath, resolveLongestMatchingSidebarNavItem } from "~/constants/navigation";

/**
 * Section breadcrumbs for the app navbar (Dashboard → current area), driven by `NAVIGATION_ITEMS`.
 */
export function useNavbarBreadcrumbs() {
  const route = useRoute();
  const { t } = useI18n();

  const navbarBreadcrumbs = computed(() => {
    const normalized = normalizeRoutePath(route.path);
    if (normalized === "/") {
      return [{ label: t("nav.dashboard") }] as const;
    }

    const section = resolveLongestMatchingSidebarNavItem(route.path);
    if (!section) {
      return [
        { label: t("nav.dashboard"), to: APP_ROUTES.dashboard },
        { label: t("nav.breadcrumbUnknown") },
      ] as const;
    }

    if (normalizeRoutePath(section.to) === "/") {
      return [{ label: t("nav.dashboard") }] as const;
    }

    return [
      { label: t("nav.dashboard"), to: APP_ROUTES.dashboard },
      { label: t(section.labelKey) },
    ] as const;
  });

  return { navbarBreadcrumbs };
}
