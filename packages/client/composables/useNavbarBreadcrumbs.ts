import { useI18n } from "vue-i18n";
import { normalizeRoutePath, resolveLongestMatchingSidebarNavItem } from "~/constants/navigation";

/**
 * Section label for the app navbar — current peer section only.
 * Nested page hierarchies use page-level `AppBreadcrumbs` (no fake Dashboard parent).
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
      return [{ label: t("nav.breadcrumbUnknown") }] as const;
    }

    return [{ label: t(section.labelKey) }] as const;
  });

  return { navbarBreadcrumbs };
}
