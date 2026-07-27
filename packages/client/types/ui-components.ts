/**
 * Item shapes for shared UI primitives.
 *
 * These live outside their `.vue` files because the ambient SFC module declaration types every
 * component as `DefineComponent<Record<string, unknown>, …>` for the native typechecker, which
 * erases prop types at the import boundary. Owning them here keeps one definition that both the
 * component and its spec import, instead of each re-deriving a shape that resolves to `unknown`.
 */
import type { AppIconName } from "~/components/icons/icon-registry";

export interface StatItem {
  titleKey: string;
  value: string | number;
  valueClass?: string;
  descKey: string;
  descInterpolation?: Record<string, string | number>;
  figure?: AppIconName;
}

export interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}
